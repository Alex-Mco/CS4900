const md5 = require('md5');
const express = require('express');
const axios = require("axios");
const cors = require("cors");
const passport = require('./passport');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');
const { connectDatabase } = require('./db');
require('dotenv').config();
const usersRoutes = require('./routes/userRoutes');
const User = require('./models/user');
const testRoutes = require('./routes/testRoute')

const app = express();

// Middleware setup
app.use(cors({
  origin: `${process.env.FRONT_URL}`, // Frontend URL
  credentials: true, // Allow credentials (cookies) to be sent
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

app.use(express.json({
  strict: true,
  verify: (req, res, buf) => {
    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('application/json')) return;

    try {
      JSON.parse(buf);
    } catch (err) {
      const preview = buf.toString().slice(0, 100);
      console.warn(`[JSON ERROR] From ${req.ip}: ${preview}`);
      throw new Error('Invalid JSON');
    }
  }
}));

app.use((err, req, res, next) => {
  if (err.message === 'Invalid JSON') {
    console.warn("Invalid JSON received from:", req.ip);
    return res.status(400).json({ error: "Malformed JSON" });
  }
  next(err);
}); // For parsing application/json
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded

// File upload setup
const multer = require('multer'); // For form data file uploads/updates
const path = require('path');
const storage = multer.diskStorage({
  destination: function(req, file, cb){
    cb(null, 'uploads/');
  },
  filename: function(req,file,cb){
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({storage})
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.set("trust proxy", true); // or 1 for single-hop if needed

const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

// Session setup with MongoDB Atlas store
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: isTest
      ? new session.MemoryStore()
      : MongoStore.create({
          mongoUrl: process.env.MONGO_URL,
          collectionName: 'sessions',
          ttl: 14 * 24 * 60 * 60, // 14 days
        }),
    proxy: isProduction, // trust proxy only in production
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      httpOnly: true,
      secure: isProduction, // secure cookies only in production
      sameSite: isProduction ? 'none' : 'lax',
    },
  })
);

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// Connect to the database before starting the server
connectDatabase()
  .then(() => {
    //test route to make sure the backend is live on AWS
    app.get('/', (req, res) => {
      res.send('Backend is live!');
    });    

    // Google OAuth routes
    app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

    app.get(
      '/auth/google/callback',
      passport.authenticate('google', { failureRedirect: '/' }),
      (req, res) => {
        res.send(`
          <html>
            <head>
              <title>Logging you in...</title>
              <script>
                // Delay a bit to let the cookie persist before redirect
                setTimeout(() => {
                  window.location.href = "${process.env.FRONT_URL}/?redirect=profile";
                }, 200);
              </script>
            </head>
            <body>
              Logging you in... please wait.
            </body>
          </html>
        `);
      }
    );
    
    app.get("/auth/session", (req, res) => {
      if (req.isAuthenticated()) {
        res.json({ isAuthenticated: true, user: req.user });
      } else {
        res.json({ isAuthenticated: false });
      }
    });

    app.get('/logout', (req, res, next) => {
      if (!req.isAuthenticated()) {
        return res.status(200).json({ message: "No active session" });
      }
    
      req.logout(err => {
        if (err) {
          console.error("Logout error:", err);
          return res.status(500).json({ error: "Logout failed" });
        }
    
        req.session.destroy(destroyErr => {
          if (destroyErr) {
            console.error("Session destroy error:", destroyErr);
            return res.status(500).json({ error: "Failed to destroy session" });
          }
    
          // clear cookie first before sending the response
          res.clearCookie("connect.sid", {
            path: "/",
            sameSite: "none",
            secure: true,
          });
    
          return res.status(200).json({ message: "Logged out successfully" });
        });
      });
    });    
    
    //Test routes
    app.use('/auth/test', testRoutes);
    // Profile routes and code (which includes collections)
    app.use('/api/users', usersRoutes);

    app.get('/profile', async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'User not authenticated' })
      }
      res.json(req.user); 
    });

    app.put('/profile-update', upload.single('profilePic'), async (req, res) => {
    
      if (!req.isAuthenticated()) {
        console.error("No user found in req.user");
        return res.status(401).json({ error: "Unauthorized: No user logged in" });
      }
    
      const { name, email, username } = req.body;
      const profilePic = req.file ? `${process.env.BACKEND_URL}/uploads/${req.file.filename}` : req.body.profilePic || "/default-profile-pic.jpg";
    
      try {
        const updatedUser = await User.findOneAndUpdate(
          { googleId: req.user.googleId },
          { name, email, username, profilePic },
          { new: true }
        );
    
        if (!updatedUser) {
          return res.status(404).json({ error: 'User not found' });
        }
        res.json(updatedUser);
      } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ error: 'Failed to update profile' });
      }
    });
    
    
    function generateHash(timestamp) {
      const privateKey = process.env.MARVEL_PRIVATE_KEY;
      const publicKey = process.env.MARVEL_PUBLIC_KEY;
      return md5(timestamp + privateKey + publicKey);
    }

    //Comic Title Search Endpoint
    app.get("/api/search", async (req, res) => {
      const searchQuery = req.query.title;
      const offset = req.query.offset || 0;
      const limit = 20;

      if (!searchQuery) {
        return res.status(400).json({ error: "Title query is required" });
      }

      const timestamp = new Date().getTime();
      const hash = generateHash(timestamp);

      try {
        const response = await axios.get("https://gateway.marvel.com/v1/public/comics", {
          params: {
            apikey: process.env.MARVEL_PUBLIC_KEY,
            ts: timestamp,
            hash: hash,
            titleStartsWith: searchQuery,
            offset: offset,
            limit: limit,
          },
        });

        // Return the results from the Marvel API
        res.json({
          results: response.data.data.results,
          total: response.data.data.total,
        });
      } catch (error) {
        console.error("Error fetching comics from Marvel API:", error);
        res.status(500).json({ error: "Failed to fetch comics" });
      }
    });

    //Character Search Endpoint
    app.get("/api/search/character", async (req, res) => {
      const searchQuery = req.query.name;
      const offset = req.query.offset || 0;
      const limit = 20;

      if (!searchQuery) {
        return res.status(400).json({ error: "Name query is required" });
      }

      const timestamp = new Date().getTime();
      const hash = generateHash(timestamp);

      try {
        // First, search for characters matching the query
        const characterResponse = await axios.get("https://gateway.marvel.com/v1/public/characters", {
          params: {
            apikey: process.env.MARVEL_PUBLIC_KEY,
            ts: timestamp,
            hash: hash,
            nameStartsWith: searchQuery,
            offset: offset,
            limit: limit,
          },
        });

        if (characterResponse.data.data.results.length === 0) {
          return res.json({ results: [], total: 0 });
        }

        // Take the first matching character's ID
        const characterId = characterResponse.data.data.results[0].id;

        // Now fetch comics for that character
        const comicsResponse = await axios.get(`https://gateway.marvel.com/v1/public/characters/${characterId}/comics`, {
          params: {
            apikey: process.env.MARVEL_PUBLIC_KEY,
            ts: timestamp,
            hash: hash,
            offset: offset,
            limit: limit,
          },
        });

        res.json({
          results: comicsResponse.data.data.results,
          total: comicsResponse.data.data.total,
        });
      } catch (error) {
        console.error("Error fetching comics by character from Marvel API:", error);
        res.status(500).json({ error: "Failed to fetch comics by character" });
      }
    });

    //Series Search Endpoint
    app.get("/api/search/series", async (req, res) => {
      const searchQuery = req.query.series;
      const offset = req.query.offset || 0;
      const limit = 20;
    
      if (!searchQuery) {
        return res.status(400).json({ error: "Series query is required" });
      }
    
      const timestamp = new Date().getTime();
      const hash = generateHash(timestamp);
    
      try {
        // First, search for series matching the query
        const seriesResponse = await axios.get("https://gateway.marvel.com/v1/public/series", {
          params: {
            apikey: process.env.MARVEL_PUBLIC_KEY,
            ts: timestamp,
            hash: hash,
            titleStartsWith: searchQuery,
            offset: offset,
            limit: limit,
          },
        });
    
        if (seriesResponse.data.data.results.length === 0) {
          return res.json({ results: [], total: 0 });
        }
    
        const matchingSeries = seriesResponse.data.data.results;

        const allComics = [];
        let totalAvailable = 0;
        for (const series of matchingSeries) {
          const seriesId = series.id;

          const comicsResponse = await axios.get(`https://gateway.marvel.com/v1/public/series/${seriesId}/comics`, {
            params: {
              apikey: process.env.MARVEL_PUBLIC_KEY,
              ts: timestamp,
              hash: hash,
              offset: 0, // optional: customize per series
              limit: 10  // optional: limit per series to avoid hitting API limit
            },
          });
          totalAvailable += comicsResponse.data.data.total;
          allComics.push(...comicsResponse.data.data.results);
        }

        res.json({
          results: allComics,
          total: totalAvailable,
        });

      } catch (error) {
        console.error("Error fetching comics by series from Marvel API:", error);
        res.status(500).json({ error: "Failed to fetch comics by series" });
      }
    });

    // Start server only after connecting to the DB
    const PORT = process.env.PORT || 8080;
    app.listen(PORT, () => console.log(`Running on ${PORT}`));


  })
  .catch(err => {
    console.error('Error connecting to the database:', err);
    process.exit(1); // Exit the process if database connection fails
  });

  // After all your routes
  app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

module.exports = app; // Export the app for testing
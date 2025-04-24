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
      const pageNumber = Math.floor((req.query.offset || 0) / 20) + 1; // Comic Vine uses page numbers
      const limit = 20;
    
      if (!searchQuery) {
        return res.status(400).json({ error: "Title query is required" });
      }
    
      try {
        const response = await axios.get("https://comicvine.gamespot.com/api/search/", {
          params: {
            api_key: process.env.COMIC_API_KEY,
            format: "json",
            query: searchQuery,
            resources: "issue",
            limit: limit,
            page: pageNumber,
          },
          headers: {
            'User-Agent': 'MarvelNexusApp/1.0'
          }
        });
    
        if (response.data.status_code !== 1) {
          throw new Error("Comic Vine API Error");
        }
    
        res.json({
          results: response.data.results,
          total: response.data.number_of_total_results,
        });
      } catch (error) {
        console.error("Error fetching comics from Comic Vine API:", error);
        res.status(500).json({ error: "Failed to fetch comics" });
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

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
  origin: 'http://localhost:5173', // Frontend URL
  credentials: true, // Allow credentials (cookies) to be sent
}));
app.use(express.json()); // For parsing application/json
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

// Session setup with MongoDB Atlas store
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: process.env.NODE_ENV === 'test' 
            ? new session.MemoryStore()  // Use in-memory store for tests
            : MongoStore.create({ 
                mongoUrl: process.env.MONGO_URL,
                collectionName: 'sessions',
                ttl: 14 * 24 * 60 * 60, // 14 days
              }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day expiration
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Set to true in production
      sameSite: "lax",
    },
  })
);

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// Connect to the database before starting the server
connectDatabase()
  .then(() => {
    // Google OAuth routes
    app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

    app.get(
      '/auth/google/callback',
      passport.authenticate('google', { failureRedirect: '/' }),
      (req, res) => {
        res.redirect('http://localhost:5173/profile');
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
      req.logout((err) => {
        if (err) {
          return next(err);
        }
        req.session.destroy(() => {
          res.clearCookie("connect.sid"); // Clear session cookie
          res.json({ message: "Logged out successfully" });
          res.redirect('/');
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
      const profilePic = req.file ? `http://localhost:5000/uploads/${req.file.filename}` : req.body.profilePic || "/default-profile-pic.jpg";
    
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
    
        // Use the first matching series' ID
        const seriesId = seriesResponse.data.data.results[0].id;
    
        // Now fetch comics for that series
        const comicsResponse = await axios.get(`https://gateway.marvel.com/v1/public/series/${seriesId}/comics`, {
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
        console.error("Error fetching comics by series from Marvel API:", error);
        res.status(500).json({ error: "Failed to fetch comics by series" });
      }
    });

    // Start server only after connecting to the DB
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

  })
  .catch(err => {
    console.error('Error connecting to the database:', err);
    process.exit(1); // Exit the process if database connection fails
  });

module.exports = app; // Export the app for testing

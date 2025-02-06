
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
const upload = multer({ dest: 'uploads/' }); // Temporary storage location for uploaded files

// Session setup with MongoDB Atlas store
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'defaultsecret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URL || 'mongodb://localhost:27017/testdb', // Ensure fallback value
      collectionName: 'sessions',
      ttl: 14 * 24 * 60 * 60, // 14 days
    }),
    cookie: {
      secure: false, // Ensure secure is false in testing environments
      httpOnly: true,
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

    app.get('/logout', (req, res, next) => {
      req.logout((err) => {
        if (err) {
          return next(err);
        }
        req.session.destroy(() => {
          res.redirect('/');
        });
      });
    });
    
    //Test routes
    app.use('/auth/test', testRoutes);
    // Profile routes and code
    app.use('/api/users', usersRoutes);

    app.get('/profile', async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'User not authenticated' })
      }
      res.json(req.user); 
    });

    app.put('/update-profile', upload.single('profilePic'), async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
      const { name, email, username } = req.body;
      const profilePic = req.file ? req.file.path : null; // Get the file path if uploaded
      try {
        const updatedUser = await User.findOneAndUpdate(
          { googleId: req.user.googleId },
          { name, email, username, profilePic },
          { new: true }
        );

        if (!updatedUser) {
          return res.status(404).json({ error: 'User not found' });
        }

        res.json(updatedUser); // Send back the updated user data
      } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ error: 'Failed to update profile' });
      }
    });

    // Collection management code
    app.get('/collections/:id', async (req, res) => {
      const { id } = req.params;
      // Check if the provided ID is a valid ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid collection ID format' });
      }

      try {
        const user = await User.findOne({ 'collections._id': id }).populate('collections.comics');
        if (!user) {
          return res.status(404).json({ error: 'Collection not found' });
        }
        const collection = user.collections.find((col) => col._id.toString() === id);
        if (!collection) {
          return res.status(404).json({ error: 'Collection not found' });
        }
        res.json(collection);
      } catch (error) {
        console.error('Error fetching collection:', error);
        res.status(500).json({ error: 'Failed to fetch collection details' });
      }
    });

    app.get("/api/search", async (req, res) => {
      const searchQuery = req.query.title;
      const offset = req.query.offset || 0;
      const limit = 20;

      if (!searchQuery) {
        return res.status(400).json({ error: "Title query is required" });
      }

      function generateHash(timestamp) {
        const privateKey = process.env.MARVEL_PRIVATE_KEY;
        const publicKey = process.env.MARVEL_PUBLIC_KEY;
        return md5(timestamp + privateKey + publicKey);
      }
      
      const timestamp = new Date().getTime();
      const hash = generateHash(timestamp);

      try {
        const response = await axios.get("https://gateway.marvel.com/v1/public/comics", {
          params: {
            apikey: process.env.MARVEL_PUBLIC_KEY,
            ts: timestamp,
            hash: hash,
            title: searchQuery,
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

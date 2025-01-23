const md5 = require('md5');
const express = require('express');
const axios = require("axios");
const cors = require("cors");
const passport = require('passport');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');
require('dotenv').config();
require('./passport');
const usersRoutes = require('./database/routes/users');
const User = require('./database/models/user');
const comicRoutes = require('./database/routes/comic');

const app = express();

// Middleware setup
app.use(cors({
  origin: 'http://localhost:5173', // Frontend URL
  credentials: true, // Allow credentials (cookies) to be sent
}));
app.use(express.json()); // For parsing application/json
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded
const multer = require('multer'); //for form data file uploads/updates
const upload = multer({ dest: 'uploads/' }); // Temporary storage location for uploaded files


// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB Atlas connected'))
.catch((err) => console.error('MongoDB connection error:', err));

// Session setup with MongoDB Atlas store
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URL, 
      collectionName: 'sessions', 
      ttl: 14 * 24 * 60 * 60, // 14 days
    }),
    cookie: { secure: process.env.NODE_ENV === 'production' }, 
  })
);

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// Google OAuth routes
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('http://localhost:5173/profile');
  }
);

app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

//profile routes and code
app.use('/users', usersRoutes);

app.get('/profile', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect('/login'); 
  }
  res.json(req.user); 
});

app.put('/update-profile', upload.single('profilePic'), async (req, res) => {
  const { name, email, username } = req.body;
  const profilePic = req.file ? req.file.path : null; // Get the file path if uploaded

  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

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

//Collection management code
//get collection details
app.get('/collections/:id', async (req, res) => {
  const { id } = req.params;
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

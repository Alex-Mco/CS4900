const express = require('express');
const User = require('../models/user');
const Comic = require('../models/comic');
const router = express.Router();

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { googleId, name, email, profilePic } = req.body;
    const existingUser = await User.findOne({ googleId: googleId });
    if (existingUser) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    const newUser = new User({
      googleId,
      name,
      email,
      profilePic,
      collections: [],
    });
    const savedUser = await newUser.save();
    res.status(201).json(savedUser);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error registering user');
  }
});

//update user information
router.put('/update/:googleId', async (req, res) => {
  try {
    const { name, email, username } = req.body;
    let profilePic = req.file ? req.file.path : null; // If using multer for file uploads

    const updatedUser = await User.findOneAndUpdate({ googleId: req.params.googleId }, {
      name,
      email,
      username,
      profilePic,
    }, { new: true });

    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).send('Error updating user');
  }
});

// Get a single user by ID
router.get('/:googleId', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('collections.comics');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error fetching user');
  }
});

// Add a new collection to a user
router.post('/:userId/collections', async (req, res) => {
  try {
    const { collectionName } = req.body;
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    user.collections.push({ collectionName, comics: [] });
    await user.save();
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error adding collection');
  }
});

// Add a comic to an existing collection
router.post('/:userId/collections/:collectionId/comics', async (req, res) => {
  try {
    const { title, issueNumber, authors, description, thumbnail, series, variant, pgCount } = req.body;
    // Create a new comic
    const newComic = new Comic({
      title,
      issueNumber,
      authors,
      description,
      thumbnail,
      series,
      variant,
      pgCount,
    });
    const savedComic = await newComic.save();
    // Find the user and collection
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const collection = user.collections.find(col => col._id.toString() === req.params.collectionId);
    if (!collection) {
      return res.status(404).json({ msg: 'Collection not found' });
    }

    // Add the comic to the collection
    collection.comics.push(savedComic._id);
    await user.save();

    res.json(collection);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error adding comic to collection');
  }
});

module.exports = router;

const express = require('express');
const User = require('../models/user');
const Comic = require('../models/comic');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const session = require('express-session');

const router = express.Router();

//registers a new user
router.post('/register', async (req, res) => {
  try {
    const { googleId, name, email, username, profilePic } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ googleId });
    if (existingUser) {
      return res.status(400).json({ msg: "User already exists" });
    }

    // Create new user
    const newUser = new User({
      googleId,
      name,
      email,
      username,
      profilePic: profilePic || "/default-profile-pic.jpg",
      collections: [],
    });

    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ msg: "Server error" });
  }
});

// Configure Multer for Profile Picture Uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Update user profile
router.put('/update-profile', upload.single('profilePic'), async (req, res) => {

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

//Return collection
router.get('/collections/:id', async (req, res) => {
  const { id } = req.params;
  // Check if the provided ID is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid collection ID format' });
  }

  try {
    const user = await User.findOne({ 'collections._id': id })
    .populate({
      path: 'collections.comics',
      populate: { path: 'creators' }
    });
    if (!user) {
      return res.status(404).json({ error: 'Collection not found' });
    }
    const collection = user.collections.find((col) => col._id.toString() === id);
    if (!collection) {s
      return res.status(404).json({ error: 'Collection not found' });
    }
    res.json({ ...collection.toObject(), userId: user._id });
  } catch (error) {
    console.error('Error fetching collection:', error);
    res.status(500).json({ error: 'Failed to fetch collection details' });
  }
});

// Add a new collection to a user
router.post('/:userId/collections', async (req, res) => {
  try {
    const { collectionName } = req.body;
    // Find the user
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

// Add a comic to a collection
router.post('/:userId/collections/:collectionId/comics', async (req, res) => {
  try {
    const { title, issueNumber, creators, description, thumbnail, series, variant, pgCount } = req.body;
    // Create a new comic
    const newComic = new Comic({
      title,
      issueNumber,
      creators,
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

// Delete comic from a collection
router.delete('/collections/:collectionId/comics/:comicId', async (req, res) => {
  try {
    const { collectionId, comicId } = req.params;

    // Find the collection
    const user = await User.findOne({ 'collections._id': collectionId });
    if (!user) {
      return res.status(404).json({ msg: 'Collection not found' });
    }

    // Find the specific collection
    const collection = user.collections.find(col => col._id.toString() === req.params.collectionId);
    if (!collection) {
      return res.status(404).json({ msg: 'Collection not found' });
    }

    // Remove the comic from the collection
    collection.comics = collection.comics.filter(comic => comic.toString() !== comicId);
    
    await user.save(); // Save changes to the database
    res.json(collection); // Return the updated collection
  } catch (error) {
    console.error('Error removing comic from collection:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Delete a collection
router.delete('/collections/:collectionId', async (req, res) => {
  try {
    const { collectionId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(collectionId)) {
      return res.status(400).json({ error: 'Invalid collection ID format' });
    }

    const user = await User.findOne({ 'collections._id': collectionId });
    if (!user) {
      return res.status(404).json({ message: 'Collection not found' });
    }
    
    const collectionIndex = user.collections.findIndex(col => col._id.toString() === collectionId);
    if (collectionIndex === -1) {
      return res.status(404).json({ message: 'Collection not found' });
    }
    
    // Delete all comics associated with the collection
    await Comic.deleteMany({ _id: { $in: user.collections[collectionIndex].comics } });
    
    // Remove the collection from the user's collections array
    user.collections.splice(collectionIndex, 1);
    
    // Save changes
    await user.save();
    res.json({ message: 'Collection and associated comics deleted successfully' });
    
  } catch (error) {
    console.error('Error deleting collection:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

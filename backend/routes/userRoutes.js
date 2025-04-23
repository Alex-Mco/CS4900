const express = require('express');
const User = require('../models/user');
const Comic = require('../models/comic');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');

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

    // Ensure creators data is properly formatted
    const formattedCreators = Array.isArray(creators)
      ? { items: creators.map(creator => ({
          role: creator.role || "Unknown",
          name: creator.name || "Unknown",
        })) }
      : { items: [] };

    // Ensure series is stored as an object (not just a string)
    const formattedSeries = series && typeof series === "object" 
      ? { name: series.name, resourceURI: series.resourceURI || "" }
      : { name: series || "Unknown", resourceURI: "" };
    // Create a new comic
    const newComic = new Comic({
      title,
      issueNumber,
      creators: formattedCreators, 
      description,
      thumbnail,
      series: formattedSeries,
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

    res.json({ msg: "Comic added to collection", collection });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error adding comic to collection');
  }
});

//Add a comic to multiple collections
// Add a comic to multiple collections at once
router.post('/:userId/comics/add-to-collections', async (req, res) => {
  try {
    const { userId } = req.params;
    const { collectionIds, comic } = req.body;

    if (!Array.isArray(collectionIds) || collectionIds.length === 0) {
      return res.status(400).json({ msg: 'No collections provided' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    // Check if comic already exists in DB by title + issueNumber (to avoid dupes)
    let existingComic = await Comic.findOne({
      title: comic.title,
      issueNumber: comic.issueNumber
    });

    if (!existingComic) {
      const formattedCreators = Array.isArray(comic.creators)
        ? { items: comic.creators.map(c => ({ role: c.role || "Unknown", name: c.name || "Unknown" })) }
        : { items: [] };

      const formattedSeries = comic.series && typeof comic.series === "object"
        ? { name: comic.series.name, resourceURI: comic.series.resourceURI || "" }
        : { name: comic.series || "Unknown", resourceURI: "" };

      const newComic = new Comic({
        title: comic.title,
        issueNumber: comic.issueNumber,
        creators: formattedCreators,
        description: comic.description || "No description available",
        thumbnail: comic.thumbnail,
        series: formattedSeries,
        variant: comic.variant || "",
        pgCount: comic.pgCount || 0,
      });

      existingComic = await newComic.save();
    }

    const comicId = existingComic._id;

    // Add the comic to each collection (if it's not already there)
    let updatedCollections = [];
    user.collections.forEach(col => {
      if (collectionIds.includes(col._id.toString())) {
        if (!col.comics.some(id => id.toString() === comicId.toString())) {
          col.comics.push(comicId);
        }
        updatedCollections.push(col.collectionName);
      }
    });

    await user.save();
    res.json({ msg: `Comic added to: ${updatedCollections.join(", ")}`, comicId });
  } catch (err) {
    console.error('Error adding comic to multiple collections:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});


// Delete comic from a collection
router.delete('/collections/:collectionId/comics/:comicId', async (req, res) => {
  try {
    const { collectionId, comicId } = req.params;

    // Validate if comicId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(comicId)) {
      console.error("Invalid comicId format:", comicId);
      return res.status(400).json({ msg: "Invalid comicId format" });
    }

    const objectIdComicId = new mongoose.Types.ObjectId(comicId);

    // Find the user who owns this collection
    const user = await User.findOne({ 'collections._id': collectionId });
    if (!user) {
      return res.status(404).json({ msg: 'Collection not found' });
    }

    // Find the specific collection
    const collection = user.collections.find(col => col._id.toString() === collectionId);
    if (!collection) {
      return res.status(404).json({ msg: 'Collection not found' });
    }

    // Ensure the comic exists in the collection before removing
    if (!collection.comics.some(c => c.toString() === objectIdComicId.toString())) {
      console.error("No matching comic found for removal:", objectIdComicId);
      return res.status(404).json({ msg: 'Comic not found in collection' });
    }

    // Remove the comic from the collection
    collection.comics = collection.comics.filter(comic => comic.toString() !== objectIdComicId.toString());

    // Update the collection inside user.collections
    user.collections = user.collections.map(col =>
      col._id.toString() === collectionId ? { ...col, comics: collection.comics } : col
    );
    
    // Save the updated user document
    await user.save();

    res.json({ msg: 'Comic removed successfully', collection });
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

//toggle favorite comics and add it to database if needed
router.post('/:userId/favorites/:comicId', async (req, res) => {
  try {
    const { userId, comicId } = req.params;
    const comicData = req.body; // frontend sends full comic info

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    let comic;

    // Try to find by _id first (if it's a valid ObjectId)
    if (mongoose.Types.ObjectId.isValid(comicId)) {
      comic = await Comic.findById(comicId);
    }

    // If not found, create it from scratch (like collection add)
    if (!comic) {
      const formattedCreators = Array.isArray(comicData.creators?.items)
        ? { items: comicData.creators.items.map(creator => ({
            role: creator.role || "Unknown",
            name: creator.name || "Unknown",
          })) }
        : { items: [] };

      const formattedSeries = comicData.series && typeof comicData.series === "object"
        ? { name: comicData.series.name, resourceURI: comicData.series.resourceURI || "" }
        : { name: comicData.series || "Unknown", resourceURI: "" };

      comic = new Comic({
        title: comicData.title,
        issueNumber: comicData.issueNumber || "N/A",
        description: comicData.description || "No description available",
        thumbnail: comicData.thumbnail,
        series: formattedSeries,
        creators: formattedCreators,
        variant: comicData.variant || "",
        pgCount: comicData.pageCount || 0,
      });

      await comic.save();
    }

    // Toggle the comic in favorites
    const comicObjectId = comic._id;
    const alreadyFavorite = user.favorites.some(id => id.equals(comicObjectId));

    if (alreadyFavorite) {
      user.favorites.pull(comicObjectId);
    } else {
      user.favorites.push(comicObjectId);
    }

    await user.save();
    res.json({ favorites: user.favorites });
  } catch (err) {
    console.error('Error toggling favorite:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// retrieve users favorite comics
router.get('/:userId/favorites', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ msg: 'Invalid user ID format' });
    }

    const user = await User.findById(userId).populate({
      path: 'favorites',
      populate: { path: 'creators' }, // Optional: if you want creator details
    });

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json(user.favorites);
  } catch (err) {
    console.error('Error fetching favorites:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
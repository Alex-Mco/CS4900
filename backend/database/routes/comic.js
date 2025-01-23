const express = require('express');
const axios = require('axios');
const Comic = require('../models/comic');
const router = express.Router();

// Function to generate a timestamp and hash for Marvel API request
const generateMarvelAuthParams = () => {
  const ts = new Date().getTime();
  const hash = require('crypto')
    .createHash('md5')
    .update(ts + process.env.MARVEL_PRIVATE_KEY + process.env.MARVEL_PUBLIC_KEY)
    .digest('hex');
  return { ts, hash };
};

// Fetch comics from Marvel API and save them to the database
router.get('/fetch-marvel-comics', async (req, res) => {
  try {
    const { ts, hash } = generateMarvelAuthParams();

    // Marvel API request to fetch comics
    const response = await axios.get(process.env.MARVEL_BASE_URL, {
      params: {
        ts,
        apikey: process.env.MARVEL_PUBLIC_KEY,
        hash,
        limit: 10,
      },
    });

    // Extract comic data from the response
    const comics = response.data.data.results.map(comic => ({
        title: comic.title,
        issueNumber: comic.issueNumber,
        authors: comic.creators.items.map(creator => creator.name).join(', '), 
        description: comic.description || 'No description available',
        thumbnail: `${comic.thumbnail.path}.${comic.thumbnail.extension}`, 
        id: comic.id,
        series: comic.series.name,
        variant: comic.variantDescription ? true : false, 
        pgCount: comic.pageCount || 0,
    }));

    // Save each comic to the database
    for (const comicData of comics) {
      const newComic = new Comic(comicData);
      await newComic.save();
    }

    res.json({ message: 'Comics fetched and saved successfully!' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;

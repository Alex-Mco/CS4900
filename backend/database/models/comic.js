//comic model schema for the database

const mongoose = require('mongoose');

const comicSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  issueNumber: {
    type: Number,
  },
  creators:[{
    role: {
      type: String,
    },
    name: {
      type: String,
    }
  }],
  description: {
    type: String,
  },
  thumbnail: {
    path: {
      type: String,
    },
    extension: {
      type: String,
    }
  },
  series:{
    type: String,
  },
  variant:{
    type: Boolean,
  },
  pgCount:{
    type: Number, 
  }
});

const Comic = mongoose.model('Comic', comicSchema);

module.exports = Comic;
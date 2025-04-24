const mongoose = require('mongoose');

const comicSchema = new mongoose.Schema({
  title: { type: String, required: true }, // Comic Vine uses "name" but we can map it to "title"
  issueNumber: { type: Number },
  creators: {
    items: [{
      role: { type: String },
      name: { type: String }
    }]
  },
  description: { type: String },
  thumbnail: { // Change to simpler URL based
    url: { type: String }
  },
  series: {
    name: { type: String },
    id: { type: Number }
  },
  pgCount: { type: Number }
});

const Comic = mongoose.model('Comic', comicSchema);

module.exports = Comic;

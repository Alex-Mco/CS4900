const mongoose = require('mongoose');

const comicSchema = new mongoose.Schema({
  title: { type: String, required: true }, 
  issueNumber: { type: Number },
  creators: {
    items: [{
      role: { type: String },
      name: { type: String }
    }]
  },
  description: { type: String },
  thumbnail: {
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

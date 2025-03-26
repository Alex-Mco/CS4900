const mongoose = require('mongoose');

const comicSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  issueNumber: {
    type: Number,
  },
  creators: {
    items: [{
      role: {
        type: String,
      },
      name: {
        type: String,
      }
    }]
  },
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
  series: {
    name: { type: String, required: false },
    resourceURI: { type: String, default: "" }
  },
  variant: {
    type: Boolean,
  },
  pgCount: {
    type: Number, 
  }
});

const Comic = mongoose.model('Comic', comicSchema);

module.exports = Comic;

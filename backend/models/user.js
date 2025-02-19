//users model schema for the database, 
//includes collection because that is directly part of the user and cannot be used otherwise

const mongoose = require('mongoose');

const collectionSchema = new mongoose.Schema({
  collectionName: {
    type: String,
    required: true,
  },
  comics: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comic'
  }], 
});

const userSchema = new mongoose.Schema({
  googleId:{
    type: String, 
    required: true, 
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required:true,
    unique: true,
  },
  password: {
    type: String,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  profilePic:{
    type: String,
    required: false,
  },
  collections: [collectionSchema],
});

const User = mongoose.model('User', userSchema);

module.exports = User;

const mongoose = require('mongoose');

async function connectDatabase() {
  if (process.env.NODE_ENV !== 'test') {
    // Use MongoDB Atlas or production database
    mongoose.connect(process.env.MONGO_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        tls: true,
      })
      .then(() => console.log('MongoDB Atlas connected'))
      .catch((err) => console.error('MongoDB connection error:', err));
  }
}
async function disconnectDatabase() {
  await mongoose.disconnect();
  console.log('MongoDB disconnected');
}

module.exports = { connectDatabase, disconnectDatabase };

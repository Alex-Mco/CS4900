const mongoose = require('mongoose');

async function connectDatabase() {
  if (process.env.NODE_ENV === 'test') {
    console.log("Skipping MongoDB Atlas connection in test mode");
    return;
  }

  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log(`Connected to MongoDB Atlas: ${mongoose.connection.name}`);
  } catch (err) {
    console.error("MongoDB connection error:", err);
    
    if (process.env.NODE_ENV !== 'development') {
      process.exit(1);
    }
  }
}

async function disconnectDatabase() {
  if (process.env.NODE_ENV === 'test') {
    await mongoose.connection.dropDatabase(); // Cleanup test data
  }
  
  await mongoose.disconnect();
  console.log('MongoDB disconnected');
}

module.exports = { connectDatabase, disconnectDatabase };
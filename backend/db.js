const mongoose = require('mongoose');

async function connectDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      tls: true,
    });

    console.log(`Connected to MongoDB Atlas: ${mongoose.connection.name} at ${mongoose.connection.host}`);
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1); // Exit the process if connection fails
  }
}

async function disconnectDatabase() {
  await mongoose.disconnect();
  console.log('MongoDB disconnected');
}

module.exports = { connectDatabase, disconnectDatabase };

const mongoose = require('mongoose');
const config = require('./env');

let mongodInstance = null;

const connectDB = async () => {
  try {
    let uri = config.mongodbUri;

    // In development or when external URI is unreachable, MongoMemoryServer ensures 100% out-of-the-box operation
    if (!uri || uri.includes('<username>')) {
      console.log('No MONGODB_URI configured. Starting real embedded MongoMemoryServer...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongodInstance = await MongoMemoryServer.create();
      uri = mongodInstance.getUri();
      console.log(`Embedded MongoDB started at: ${uri}`);
    }

    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 4000 });
      console.log(`Connected to MongoDB: ${mongoose.connection.host}`);
    } catch (connErr) {
      console.warn(`External MongoDB connection failed (${connErr.message}). Falling back to embedded MongoMemoryServer...`);
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongodInstance = await MongoMemoryServer.create();
      uri = mongodInstance.getUri();
      await mongoose.connect(uri);
      console.log(`Fallback Embedded MongoDB connected at: ${uri}`);
    }
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongodInstance) {
      await mongodInstance.stop();
    }
  } catch (err) {
    console.error('Error disconnecting MongoDB:', err);
  }
};

module.exports = { connectDB, disconnectDB };

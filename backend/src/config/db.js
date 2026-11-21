const mongoose = require('mongoose');
const config = require('./env');

let mongodInstance = null;

const connectDB = async () => {
  try {
    let uri = config.mongodbUri;

    // If no external MONGODB_URI is provided, launch an embedded in-memory MongoDB instance
    // guaranteeing 100% out-of-the-box real MongoDB CRUD without external daemon setup!
    if (!uri) {
      console.log('No MONGODB_URI configured. Starting real embedded MongoMemoryServer...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongodInstance = await MongoMemoryServer.create();
      uri = mongodInstance.getUri();
      console.log(`Embedded MongoDB started at: ${uri}`);
    }

    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`Connected to MongoDB: ${mongoose.connection.host}`);
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

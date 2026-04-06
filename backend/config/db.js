const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let memoryServer;

const connectMemoryDB = async () => {
  memoryServer = await MongoMemoryServer.create();
  const uri = memoryServer.getUri();
  await mongoose.connect(uri);
  console.log('In-memory MongoDB connected');
};

const connectDB = async () => {
  const useMemory = process.env.USE_IN_MEMORY_DB === 'true';
  const isProduction = process.env.NODE_ENV === 'production';

  if (useMemory) {
    await connectMemoryDB();
    return;
  }

  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is required when USE_IN_MEMORY_DB is false.');
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
  } catch (error) {
    if (isProduction) {
      throw error;
    }

    console.warn(`MongoDB connection failed: ${error.message}`);
    console.warn('Falling back to in-memory MongoDB.');
    await connectMemoryDB();
  }
};

const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }

  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
};

module.exports = { connectDB, disconnectDB };

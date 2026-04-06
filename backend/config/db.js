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

  if (useMemory) {
    await connectMemoryDB();
    return;
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
  } catch (error) {
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

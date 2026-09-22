const mongoose = require('mongoose');
const { env } = require('./env');

async function connectDB() {
  if (!env.mongoUri) {
    console.warn('[db] MONGO_URI not set - skipping MongoDB connection');
    return { connected: false, error: 'MONGO_URI not set' };
  }

  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: 8000,
    });
    console.log('[db] MongoDB connected');
    return { connected: true };
  } catch (err) {
    console.error(`[db] MongoDB connection failed: ${err.message}`);
    return { connected: false, error: err.message };
  }
}

function getDbState() {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  return {
    state: states[mongoose.connection.readyState] || 'unknown',
    connected: mongoose.connection.readyState === 1,
  };
}

module.exports = { connectDB, getDbState };

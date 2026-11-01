import mongoose from 'mongoose';
import { envConfig } from './env.config.js';
import { logger } from './logger.config.js';

const MONGO_OPTIONS = {
  maxPoolSize: 50,
  minPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  family: 4, // Force IPv4
};

/**
 * Initialize MongoDB connection with event handlers
 */
export const connectDB = async () => {
  // Bind lifecycle events before connecting
  mongoose.connection.on('connected', () => {
    logger.info('MongoDB connection established successfully.');
  });

  mongoose.connection.on('error', err => {
    logger.error('MongoDB connection error:', { error: err.message, stack: err.stack });
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB connection lost. Attempting reconnection...');
  });

  mongoose.connection.on('reconnected', () => {
    logger.info('MongoDB reconnected.');
  });

  try {
    const conn = await mongoose.connect(envConfig.MONGODB_URI, MONGO_OPTIONS);
    logger.info(
      `MongoDB connected to host: ${conn.connection.host}, database: ${conn.connection.name}`
    );
    return conn;
  } catch (error) {
    logger.error('Failed to connect to MongoDB initially:', {
      error: error.message,
      uri: envConfig.MONGODB_URI,
    });
    // In strict production, rethrow or allow server bootstrap to handle retry/exit
    throw error;
  }
};

/**
 * Disconnect MongoDB gracefully during process shutdown
 */
export const disconnectDB = async () => {
  try {
    await mongoose.connection.close(false);
    logger.info('MongoDB connection closed gracefully through app termination.');
  } catch (error) {
    logger.error('Error closing MongoDB connection:', { error: error.message });
  }
};

/**
 * Check MongoDB connection status
 * 0: disconnected, 1: connected, 2: connecting, 3: disconnecting
 */
export const getDBStatus = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  return {
    state: states[mongoose.connection.readyState] || 'unknown',
    isHealthy: mongoose.connection.readyState === 1,
  };
};

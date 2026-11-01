import mongoose, { ConnectOptions } from 'mongoose';
import { envConfig } from './env.config.js';
import { logger } from './logger.config.js';

const MONGO_OPTIONS: ConnectOptions = {
  maxPoolSize: 50,
  minPoolSize: 10,
  serverSelectionTimeoutMS: 8000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  family: 4,
};

export const connectDB = async (): Promise<typeof mongoose> => {
  mongoose.connection.on('connected', () => {
    logger.info('MongoDB Atlas connection established successfully.');
  });

  mongoose.connection.on('error', (err: Error) => {
    logger.error('MongoDB Atlas connection error:', { error: err.message, stack: err.stack });
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB Atlas connection lost. Attempting reconnection...');
  });

  mongoose.connection.on('reconnected', () => {
    logger.info('MongoDB Atlas reconnected successfully.');
  });

  try {
    const conn = await mongoose.connect(envConfig.MONGODB_URI, MONGO_OPTIONS);
    logger.info(`MongoDB connected to cluster database: ${conn.connection.name}`);
    return conn;
  } catch (error: any) {
    logger.error('Failed to connect to MongoDB cluster:', {
      error: error.message,
    });
    throw error;
  }
};

export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.connection.close(false);
    logger.info('MongoDB Atlas connection pool closed cleanly.');
  } catch (error: any) {
    logger.error('Error closing MongoDB connection:', { error: error.message });
  }
};

export const getDBStatus = () => {
  const states: Record<number, string> = {
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


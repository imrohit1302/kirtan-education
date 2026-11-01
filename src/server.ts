import { Server } from 'node:http';
import app from './app.js';
import { connectDB, disconnectDB } from './config/db.config.js';
import { envConfig } from './config/env.config.js';
import { logger } from './config/logger.config.js';
import { seedInitialUser } from './scripts/seed.js';

let server: Server | undefined;

process.on('uncaughtException', (err: Error) => {
  logger.error('CRITICAL: Uncaught Exception! Shutting down process immediately...', {
    error: err.message,
    stack: err.stack,
  });
  process.exit(1);
});

const gracefulShutdown = (signal: string) => {
  logger.warn(`Received ${signal}. Starting graceful shutdown...`);

  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed. In-flight requests finished.');

      try {
        await disconnectDB();
        logger.info('Database connection closed cleanly.');
        process.exit(0);
      } catch (dbErr: any) {
        logger.error('Error during database teardown:', { error: dbErr.message });
        process.exit(1);
      }
    });

    setTimeout(() => {
      logger.error('Forced shutdown timeout reached (10s). Terminating process.');
      process.exit(1);
    }, 10000).unref();
  } else {
    process.exit(0);
  }
};

const bootstrap = async () => {
  try {
    // 1. Connect to MongoDB Atlas
    await connectDB();

    // 2. Seed initial required account if not exists
    await seedInitialUser();

    // 3. Start HTTP server on port 9003
    server = app.listen(envConfig.PORT, () => {
      logger.info('====================================================');
      logger.info(`🚀 Kirtan Education API running in [${envConfig.NODE_ENV}] mode`);
      logger.info(`🌐 Listening on: http://localhost:${envConfig.PORT}`);
      logger.info(`🩺 Health check: http://localhost:${envConfig.PORT}/api/v1/health`);
      logger.info('====================================================');
    });

    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        logger.error(`Port ${envConfig.PORT} is already in use.`);
      } else {
        logger.error('Server encountered an error:', { error: err.message });
      }
      process.exit(1);
    });
  } catch (error: any) {
    logger.error('Bootstrap failure: Unable to start application server', {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
};

process.on('unhandledRejection', (reason: any) => {
  logger.error('Unhandled Promise Rejection detected:', {
    reason: reason instanceof Error ? reason.message : reason,
    stack: reason instanceof Error ? reason.stack : undefined,
  });

  gracefulShutdown('unhandledRejection');
});

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

bootstrap();


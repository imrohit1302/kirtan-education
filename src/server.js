import app from './app.js';
import { connectDB, disconnectDB } from './config/db.config.js';
import { envConfig } from './config/env.config.js';
import { logger } from './config/logger.config.js';

let server;

/**
 * Handle Uncaught Synchronous Exceptions
 * Must be registered before any other code runs
 */
process.on('uncaughtException', err => {
  logger.error('CRITICAL: Uncaught Exception detected! Shutting down process immediately...', {
    error: err.message,
    stack: err.stack,
  });
  process.exit(1);
});

/**
 * Graceful Process Shutdown Handler
 */
const gracefulShutdown = signal => {
  logger.warn(`Received ${signal}. Starting graceful shutdown...`);

  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed. In-flight requests finished.');

      try {
        await disconnectDB();
        logger.info('Database connections closed cleanly.');
        process.exit(0);
      } catch (dbErr) {
        logger.error('Error during database teardown:', { error: dbErr.message });
        process.exit(1);
      }
    });

    // Enforce shutdown after 10-second timeout if hanging requests remain
    setTimeout(() => {
      logger.error('Forced shutdown timeout reached (10s). Terminating process immediately.');
      process.exit(1);
    }, 10000).unref();
  } else {
    process.exit(0);
  }
};

/**
 * Bootstrap the Application Server
 */
const bootstrap = async () => {
  try {
    // 1. Establish Database Connection
    await connectDB();

    // 2. Start HTTP Server on specified port (9003)
    server = app.listen(envConfig.PORT, () => {
      logger.info('====================================================');
      logger.info(`🚀 Server running in [${envConfig.NODE_ENV}] mode`);
      logger.info(`🌐 Listening on: http://localhost:${envConfig.PORT}`);
      logger.info(`🩺 Health check: http://localhost:${envConfig.PORT}/api/v1/health`);
      logger.info('====================================================');
    });

    server.on('error', err => {
      if (err.code === 'EADDRINUSE') {
        logger.error(`Port ${envConfig.PORT} is already in use.`);
      } else {
        logger.error('Server encountered an error:', { error: err.message });
      }
      process.exit(1);
    });
  } catch (error) {
    logger.error('Bootstrap failure: Unable to start application server', {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
};

/**
 * Handle Unhandled Asynchronous Promise Rejections
 */
process.on('unhandledRejection', reason => {
  logger.error('Unhandled Promise Rejection detected:', {
    reason: reason instanceof Error ? reason.message : reason,
    stack: reason instanceof Error ? reason.stack : undefined,
  });

  // Gracefully close server and exit
  gracefulShutdown('unhandledRejection');
});

// Process signal listeners for container orchestration (Docker/Kubernetes/PM2)
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

bootstrap();

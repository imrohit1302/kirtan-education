import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import morgan from 'morgan';

import { corsOptions } from './config/cors.config.js';
import { envConfig } from './config/env.config.js';
import { morganStream } from './config/logger.config.js';
import { globalErrorHandler } from './middlewares/error.middleware.js';
import { notFoundMiddleware } from './middlewares/notFound.middleware.js';
import { apiLimiter } from './middlewares/rateLimiter.middleware.js';
import { requestIdMiddleware } from './middlewares/requestId.middleware.js';
import {
  helmetMiddleware,
  hppMiddleware,
  mongoSanitizer,
} from './middlewares/security.middleware.js';

import authRoutes from './modules/auth/auth.routes.js';
import healthRoutes from './modules/health/health.routes.js';
import userRoutes from './modules/user/user.routes.js';
import { ApiResponse } from './utils/apiResponse.js';

const app = express();

// Trust reverse proxy (AWS ALB, Nginx, Cloudflare, Heroku)
app.set('trust proxy', 1);

// Attach Request ID / Correlation ID
app.use(requestIdMiddleware);

// Security Headers
app.use(helmetMiddleware);

// CORS Protection
app.use(cors(corsOptions));

// HTTP Request Logger
const morganFormat =
  envConfig.NODE_ENV === 'production'
    ? '[:date[iso]] :id :method :url :status :response-time ms - :res[content-length]'
    : ':method :url :status :response-time ms - :res[content-length]';

morgan.token('id', req => req.id || 'N/A');
app.use(morgan(morganFormat, { stream: morganStream }));

// Body Parsers with DoS size limits
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// NoSQL Injection & Parameter Pollution Defense
app.use(mongoSanitizer);
app.use(hppMiddleware);

// Response Compression
app.use(compression());

// Apply Rate Limiting to all /api routes
app.use('/api', apiLimiter);

// Root Welcome Route
app.get('/', (req, res) => {
  return ApiResponse.success(res, 'Welcome to Kirtan Education API', {
    service: 'Kirtan-Education-Core-API',
    version: '1.0.0',
    documentation: '/api/v1/health',
    status: 'Operational',
  });
});

// Mount Versioned API Routes
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);

// Handle 404 Route Not Found
app.use(notFoundMiddleware);

// Centralized Global Error Handler (must be the last middleware in pipeline)
app.use(globalErrorHandler);

export default app;

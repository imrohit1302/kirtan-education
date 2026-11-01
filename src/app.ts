import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Express, Request, Response } from 'express';
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
import apiRouter from './routes/index.js';
import { ApiResponse } from './utils/apiResponse.js';

const app: Express = express();

app.set('trust proxy', 1);

app.use(requestIdMiddleware);
app.use(helmetMiddleware);
app.use(cors(corsOptions));

const morganFormat =
  envConfig.NODE_ENV === 'production'
    ? '[:date[iso]] :id :method :url :status :response-time ms - :res[content-length]'
    : ':method :url :status :response-time ms - :res[content-length]';

morgan.token('id', (req: Request) => req.id || 'N/A');
app.use(morgan(morganFormat, { stream: morganStream }));

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

app.use(mongoSanitizer);
app.use(hppMiddleware);
app.use(compression());

app.use('/api', apiLimiter);

// Root Welcome Route
app.get('/', (_req: Request, res: Response) => {
  return ApiResponse.success(res, 'Welcome to Kirtan Education API', {
    service: 'Kirtan-Education-Core-API (TypeScript)',
    version: '1.0.0',
    documentation: '/api/v1/health',
    status: 'Operational',
  });
});

// Mount Centralized Versioned API Routes (health, auth, users)
app.use('/api/v1', apiRouter);

// Catch-All 404 Route Not Found
app.use(notFoundMiddleware);

// Centralized Global Error Handler
app.use(globalErrorHandler);

export default app;

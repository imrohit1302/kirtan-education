import { CorsOptions } from 'cors';
import { envConfig } from './env.config.js';
import { ApiError } from '../utils/apiError.js';

const allowedOrigins =
  envConfig.CORS_ORIGIN === '*'
    ? ['*']
    : envConfig.CORS_ORIGIN.split(',').map(origin => origin.trim());

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(ApiError.forbidden(`CORS policy blocked access from origin: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Request-Id',
    'X-Requested-With',
    'Accept',
    'Cache-Control',
  ],
  exposedHeaders: ['X-Request-Id', 'Content-Range', 'X-Content-Range'],
  maxAge: 86400,
  optionsSuccessStatus: 204,
};

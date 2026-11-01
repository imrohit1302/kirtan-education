import { envConfig } from './env.config.js';
import { ApiError } from '../utils/apiError.js';

const allowedOrigins =
  envConfig.CORS_ORIGIN === '*'
    ? ['*']
    : envConfig.CORS_ORIGIN.split(',').map(origin => origin.trim());

export const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests or same-origin requests (where origin is undefined)
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(ApiError.forbidden(`CORS policy does not allow access from origin: ${origin}`));
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
  maxAge: 86400, // 24 hours preflight caching
  optionsSuccessStatus: 204,
};

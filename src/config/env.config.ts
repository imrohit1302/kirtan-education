import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(9003),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  // Support both JWT_SECRET_KEY and JWT_ACCESS_SECRET
  JWT_SECRET_KEY: z.string().min(10).optional(),
  JWT_ACCESS_SECRET: z.string().min(10).default('abcdefghijklmnopqrstuvwxyz'),
  JWT_ACCESS_EXPIRATION: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(10).default('7f8a9b2c3d4e5f6a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a'),
  JWT_REFRESH_EXPIRATION: z.string().default('7d'),
  JWT_COOKIE_EXPIRES_IN_DAYS: z.coerce.number().int().positive().default(7),
  CORS_ORIGIN: z.string().default('*'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  AUTH_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(20),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'debug']).default('debug'),

  // SMTP Email Settings
  SMTP_EMAIL: z.string().email().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().default('vidyalyaraag@gmail.com'),
  SMTP_PORT: z.coerce.number().int().default(587),
  SMTP_SECURE: z.coerce.boolean().default(false),
});

const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
  console.error('❌ FATAL: Environment validation failed:');
  console.error(
    JSON.stringify(
      parseResult.error.issues.map(issue => ({
        variable: issue.path.join('.'),
        issue: issue.message,
      })),
      null,
      2
    )
  );
  process.exit(1);
}

const rawConfig = parseResult.data;

export const envConfig = Object.freeze({
  ...rawConfig,
  // Guarantee active JWT secret uses JWT_SECRET_KEY if provided
  JWT_ACCESS_SECRET: rawConfig.JWT_SECRET_KEY || rawConfig.JWT_ACCESS_SECRET,
});

export type EnvConfig = typeof envConfig;

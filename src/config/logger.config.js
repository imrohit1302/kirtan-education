import winston from 'winston';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { envConfig } from './env.config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logDir = path.resolve(__dirname, '../../logs');

const { combine, timestamp, printf, colorize, json, errors } = winston.format;

// Human-readable format for development
const devConsoleFormat = printf(({ level, message, timestamp: time, stack, ...meta }) => {
  const metaString = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
  return `[${time}] ${level}: ${stack || message} ${metaString}`;
});

const isDev = envConfig.NODE_ENV === 'development';

export const logger = winston.createLogger({
  level: envConfig.LOG_LEVEL,
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    errors({ stack: true }),
    isDev ? colorize() : json()
  ),
  defaultMeta: { service: 'kirtan-education-api' },
  transports: [
    new winston.transports.Console({
      format: isDev ? combine(colorize(), devConsoleFormat) : json(),
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true,
      format: json(),
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true,
      format: json(),
    }),
  ],
  exitOnError: false,
});

// Stream adapter for Morgan HTTP logger
export const morganStream = {
  write: message => {
    logger.http(message.trim());
  },
};

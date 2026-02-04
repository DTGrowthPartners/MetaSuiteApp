// ===========================================
// META CREATIVE BUILDER - Logger
// ===========================================

import winston from 'winston';
import { config } from '../config/index.js';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom format for development
const devFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  if (Object.keys(meta).length > 0) {
    msg += ` ${JSON.stringify(meta, null, 2)}`;
  }
  if (stack) {
    msg += `\n${stack}`;
  }
  return msg;
});

// Custom format for production (JSON)
const prodFormat = printf(({ level, message, timestamp, ...meta }) => {
  return JSON.stringify({
    timestamp,
    level,
    message,
    ...meta
  });
});

// Create logger instance
export const logger = winston.createLogger({
  level: config.logging.level,
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' })
  ),
  defaultMeta: { service: 'creative-builder' },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: combine(
        colorize(),
        config.isDev ? devFormat : prodFormat
      )
    })
  ]
});

// Add file transports in production
if (config.isProd) {
  logger.add(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: prodFormat
    })
  );
  logger.add(
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: prodFormat
    })
  );
}

// Utility functions for structured logging
export const logMetaApiCall = (
  action: string,
  endpoint: string,
  success: boolean,
  duration?: number,
  error?: string
) => {
  const logData = {
    type: 'meta_api',
    action,
    endpoint,
    success,
    duration,
    error
  };

  if (success) {
    logger.info(`Meta API: ${action}`, logData);
  } else {
    logger.error(`Meta API Error: ${action}`, logData);
  }
};

export const logJobProgress = (
  jobId: string,
  status: string,
  details?: Record<string, unknown>
) => {
  logger.info(`Job ${jobId}: ${status}`, {
    type: 'job_progress',
    jobId,
    status,
    ...details
  });
};

export const logError = (
  error: Error,
  context?: Record<string, unknown>
) => {
  logger.error(error.message, {
    type: 'error',
    name: error.name,
    stack: error.stack,
    ...context
  });
};

export default logger;

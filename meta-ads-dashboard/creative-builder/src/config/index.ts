// ===========================================
// META CREATIVE BUILDER - Configuration
// ===========================================

import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

// ===========================================
// Environment Schema Validation
// ===========================================

const EnvSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),

  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // Meta API
  META_API_VERSION: z.string().default('v18.0'),
  META_APP_ID: z.string().optional(),
  META_APP_SECRET: z.string().optional(),
  META_ACCESS_TOKEN: z.string(),

  // Storage
  STORAGE_PROVIDER: z.enum(['s3', 'r2', 'local', 'mock']).default('local'),
  STORAGE_LOCAL_PATH: z.string().default('./uploads'),
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().default('us-east-1'),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),
  S3_ENDPOINT: z.string().optional(),

  // AI
  AI_PROVIDER: z.enum(['openai', 'anthropic', 'mock']).default('mock'),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-4-vision-preview'),
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default('claude-3-opus-20240229'),

  // Media Processing
  FFMPEG_PATH: z.string().optional(),
  WHISPER_PROVIDER: z.enum(['openai', 'local', 'mock']).default('mock'),
  OCR_PROVIDER: z.enum(['tesseract', 'mock']).default('tesseract'),

  // Security
  ENCRYPTION_KEY: z.string().min(32),
  JWT_SECRET: z.string().min(16),

  // App
  PORT: z.string().default('3003'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('debug'),
  CORS_ORIGIN: z.string().default('*'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('60000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100')
});

// Validate and parse environment
const parseEnv = () => {
  try {
    return EnvSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Environment validation failed:');
      error.errors.forEach(err => {
        console.error(`  ${err.path.join('.')}: ${err.message}`);
      });
      // In development, continue with defaults
      if (process.env.NODE_ENV === 'development') {
        console.warn('Continuing with defaults in development mode...');
        return {
          DATABASE_URL: process.env.DATABASE_URL || 'postgresql://localhost:5432/meta_creative',
          REDIS_URL: 'redis://localhost:6379',
          META_API_VERSION: 'v18.0',
          META_ACCESS_TOKEN: process.env.META_ACCESS_TOKEN || '',
          STORAGE_PROVIDER: 'mock' as const,
          STORAGE_LOCAL_PATH: './uploads',
          AI_PROVIDER: 'mock' as const,
          WHISPER_PROVIDER: 'mock' as const,
          OCR_PROVIDER: 'mock' as const,
          ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || '0'.repeat(64),
          JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-key',
          PORT: '3003',
          NODE_ENV: 'development' as const,
          LOG_LEVEL: 'debug' as const,
          CORS_ORIGIN: '*',
          RATE_LIMIT_WINDOW_MS: '60000',
          RATE_LIMIT_MAX_REQUESTS: '100'
        };
      }
      process.exit(1);
    }
    throw error;
  }
};

const env = parseEnv();

// ===========================================
// Configuration Export
// ===========================================

export const config = {
  // Server
  server: {
    port: parseInt(env.PORT),
    nodeEnv: env.NODE_ENV,
    baseUrl: process.env.BASE_URL || `http://localhost:${env.PORT}`,
    corsOrigins: env.CORS_ORIGIN.split(',').map(o => o.trim())
  },
  port: parseInt(env.PORT),
  nodeEnv: env.NODE_ENV,
  isDev: env.NODE_ENV === 'development',
  isProd: env.NODE_ENV === 'production',

  // Database
  database: {
    url: env.DATABASE_URL
  },

  // Redis
  redis: {
    url: env.REDIS_URL
  },

  // Meta API
  meta: {
    apiVersion: env.META_API_VERSION,
    baseUrl: `https://graph.facebook.com/${env.META_API_VERSION}`,
    appId: env.META_APP_ID,
    appSecret: env.META_APP_SECRET,
    defaultAccessToken: env.META_ACCESS_TOKEN
  },

  // Storage
  storage: {
    provider: env.STORAGE_PROVIDER,
    localPath: env.STORAGE_LOCAL_PATH,
    s3: {
      bucket: env.S3_BUCKET,
      region: env.S3_REGION,
      accessKey: env.S3_ACCESS_KEY,
      secretKey: env.S3_SECRET_KEY,
      endpoint: env.S3_ENDPOINT
    }
  },

  // AI
  ai: {
    provider: env.AI_PROVIDER,
    apiKey: env.AI_PROVIDER === 'openai' ? env.OPENAI_API_KEY : env.ANTHROPIC_API_KEY,
    model: env.AI_PROVIDER === 'openai' ? env.OPENAI_MODEL : env.ANTHROPIC_MODEL,
    openai: {
      apiKey: env.OPENAI_API_KEY,
      model: env.OPENAI_MODEL
    },
    anthropic: {
      apiKey: env.ANTHROPIC_API_KEY,
      model: env.ANTHROPIC_MODEL
    }
  },

  // Media Processing
  media: {
    ffmpegPath: env.FFMPEG_PATH,
    whisperProvider: env.WHISPER_PROVIDER,
    ocrProvider: env.OCR_PROVIDER,
    frameExtraction: {
      count: 12,         // Number of frames to extract
      format: 'jpg',
      quality: 80
    }
  },

  // Security
  security: {
    encryptionKey: env.ENCRYPTION_KEY,
    jwtSecret: env.JWT_SECRET
  },

  // Logging
  logging: {
    level: env.LOG_LEVEL
  },

  // CORS
  cors: {
    origin: env.CORS_ORIGIN.split(',').map(o => o.trim())
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(env.RATE_LIMIT_WINDOW_MS),
    maxRequests: parseInt(env.RATE_LIMIT_MAX_REQUESTS)
  },

  // Copy Generation Rules
  copyRules: {
    primary: {
      minLength: 80,
      maxLength: 180,
      maxEmojis: 1
    },
    headline: {
      maxLength: 40
    },
    description: {
      maxLength: 60
    },
    variantsCount: 5
  },

  // Queue Configuration
  queue: {
    names: {
      analyze: 'analyze-asset',
      generate: 'generate-copies',
      publish: 'publish-draft'
    },
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential' as const,
        delay: 2000
      },
      removeOnComplete: 100,
      removeOnFail: 50
    }
  }
};

export default config;

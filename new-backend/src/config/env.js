const { z } = require('zod');
const dotenv = require('dotenv');

dotenv.config();

/**
 * CivicGuide Environment Configuration
 * Strictly validated using Zod to ensure production readiness.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5003'),

  // Database & Cache
  MONGODB_URI: z.string().url({ message: 'MONGODB_URI must be a valid URL' }),
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // AI Services (Strictly Required for Core Functionality)
  GOOGLE_PROJECT_ID: z.string().min(1, 'GOOGLE_PROJECT_ID is required'),
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required'),
  GEMINI_MODEL: z.string().default('gemini-1.5-flash'),

  MISTRAL_API_KEY: z.string().optional(),
  MISTRAL_MODEL: z.string().default('mistral-small-latest'),
  MISTRAL_TIMEOUT: z.string().default('20000'),

  // Google Cloud Infrastructure
  FIREBASE_SERVICE_ACCOUNT: z.string().optional(),
  GCS_BUCKET_NAME: z.string().min(1, 'GCS_BUCKET_NAME is required'),
  PUBSUB_ANALYTICS_TOPIC: z.string().min(1, 'PUBSUB_ANALYTICS_TOPIC is required'),
  GOOGLE_MAPS_API_KEY: z.string().optional(),

  // Auth (CRITICAL: No default for JWT_SECRET in production)
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  COOKIE_SECRET: z.string().min(32, 'COOKIE_SECRET must be at least 32 characters').default('civicguide_pulse_cookie_secret_long_string_2026'),

  // Feature Flags
  USE_LEGACY_AI_LOGIC: z.enum(['true', 'false']).default('false').transform(v => v === 'true'),
  USE_LEGACY_CACHE: z.enum(['true', 'false']).default('false').transform(v => v === 'true'),
});

// Perform validation
let env;
try {
  env = envSchema.parse(process.env);
} catch (error) {
  console.error('❌ Environment Validation Failed:');
  error.errors.forEach(err => {
    console.error(`   - ${err.path.join('.')}: ${err.message}`);
  });
  process.exit(1);
}

module.exports = env;

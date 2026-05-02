const { z } = require('zod');
const dotenv = require('dotenv');

dotenv.config();

/**
 * CivicGuide Environment Configuration
 * Validated using Zod. Provides safe defaults for non-critical services
 * to prevent serverless cold-start crashes on Vercel.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5003'),

  // Database & Cache
  MONGODB_URI: z.string().default('mongodb://localhost:27017/civicguide'),
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // AI Services
  GOOGLE_PROJECT_ID: z.string().default('civicguide-local'),
  GEMINI_API_KEY: z.string().default(''),
  GEMINI_MODEL: z.string().default('gemini-1.5-flash'),

  MISTRAL_API_KEY: z.string().optional(),
  MISTRAL_MODEL: z.string().default('mistral-small-latest'),
  MISTRAL_TIMEOUT: z.string().default('20000'),

  // Google Cloud Infrastructure
  FIREBASE_SERVICE_ACCOUNT: z.string().optional(),
  GCS_BUCKET_NAME: z.string().default('civicguide-bucket'),
  PUBSUB_ANALYTICS_TOPIC: z.string().default('civicguide-analytics'),
  GOOGLE_MAPS_API_KEY: z.string().optional(),

  // Auth
  JWT_SECRET: z.string().default('civicguide_jwt_secret_default_dev_only_change_in_prod_32chars'),
  COOKIE_SECRET: z.string().default('civicguide_cookie_secret_default_dev_only_change_prod_32chars'),

  // Feature Flags
  USE_LEGACY_AI_LOGIC: z.enum(['true', 'false']).default('false').transform(v => v === 'true'),
  USE_LEGACY_CACHE: z.enum(['true', 'false']).default('false').transform(v => v === 'true'),
});

// Perform validation — log warnings but NEVER crash the process
let env;
try {
  env = envSchema.parse(process.env);
} catch (error) {
  console.error('⚠️ Environment Validation Warning:');
  if (error.errors) {
    error.errors.forEach(err => {
      console.error(`   - ${err.path.join('.')}: ${err.message}`);
    });
  }
  // Fallback: use defaults instead of crashing
  env = envSchema.parse({});
}

module.exports = env;

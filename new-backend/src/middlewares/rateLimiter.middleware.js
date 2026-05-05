const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const redis = require('../config/redis');
const winston = require('winston');

/**
 * Creates a RedisStore for rate limiting with a graceful in-memory fallback.
 * Prevents application crashes if the Redis instance is unavailable.
 */
const getStore = (prefix) => {
  if (process.env.NODE_ENV === 'test') return undefined;
  try {

    return new RedisStore({
      sendCommand: (...args) => redis.call(...args),
      prefix: `rl:${prefix}:`,
    });
  } catch (err) {
    winston.warn(`⚠️ Redis store for "${prefix}" unavailable, falling back to in-memory rate limiter:`, err.message);
    return undefined; // express-rate-limit defaults to MemoryStore
  }
};

// 1. General Rate Limiter (Public)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 100 : 5000, // Very lenient in dev
  standardHeaders: true,
  legacyHeaders: false,
  store: getStore('general'),
});

// 2. Auth Rate Limiter (Brute-force protection)
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 20 : 1000, // Very lenient in dev
  message: { success: false, error: 'Too many auth attempts. Try again in an hour.' },
  store: getStore('auth'),
});

// 3. AI Rate Limiter (Cost protection - UID Based)
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 50 : 5000, // Very lenient in dev
  keyGenerator: (req) => req.user?.uid || req.ip,
  message: { success: false, error: 'AI limit reached. Please try again later.' },
  store: getStore('ai'),
});

module.exports = { generalLimiter, authLimiter, aiLimiter };

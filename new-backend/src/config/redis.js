const Redis = require('ioredis');
const env = require('./env');
const winston = require('winston');

// 1. Connection Optimization
// If using Upstash, rediss:// (TLS) is often more stable.
// We also force IPv4 (family: 4) to avoid potential DNS/IPv6 resolution issues on some local networks.
const redisUrl = env.REDIS_URL.replace('redis://', 'rediss://');

const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  connectTimeout: 10000,
  family: 4, // Force IPv4
  keepAlive: 10000,
  retryStrategy: (times) => {
    // Exponential backoff with a cap
    const delay = Math.min(times * 200, 5000);
    return delay;
  },
  reconnectOnError: (err) => {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      return true;
    }
    return false;
  },
});

// 2. Event Handling with Log Debouncing
// Prevents flooding the console if the connection is flapping
let isConnected = false;

redis.on('connect', () => {
  if (!isConnected) {
    winston.info('✅ Redis Connected');
    isConnected = true;
  }
});

redis.on('error', (err) => {
  isConnected = false;
  winston.error('❌ Redis Error:', {
    message: err.message,
    code: err.code,
    stack: env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

redis.on('close', () => {
  if (isConnected) {
    winston.warn('🔌 Redis connection closed');
    isConnected = false;
  }
});

module.exports = redis;


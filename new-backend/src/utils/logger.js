/**
 * @fileoverview Structured Logging Utility
 */
const winston = require('winston');
const { AsyncLocalStorage } = require('async_hooks');

// Storage for requestId
const storage = new AsyncLocalStorage();

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  defaultMeta: { service: 'civicguide-backend' },
  transports: [
    new winston.transports.Console(),
  ],
});

/**
 * Custom logger that automatically injects requestId from storage
 */
const log = {
  info: (msg, meta = {}) => logger.info(msg, { ...meta, requestId: storage.getStore() }),
  error: (msg, meta = {}) => logger.error(msg, { ...meta, requestId: storage.getStore() }),
  warn: (msg, meta = {}) => logger.warn(msg, { ...meta, requestId: storage.getStore() }),
  debug: (msg, meta = {}) => logger.debug(msg, { ...meta, requestId: storage.getStore() }),
};

module.exports = { log, storage };

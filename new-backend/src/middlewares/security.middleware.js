/**
 * @fileoverview Security Middlewares
 */
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const { ForbiddenError } = require('../utils/errors');
const env = require('../config/env');

/**
 * Helmet configuration
 */
const securityHeaders = helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
});

/**
 * CSRF Protection Middleware
 * Requires custom header and application/json on state-changing requests
 */
const csrfProtection = (req, res, next) => {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const ct = req.headers['content-type'] || '';
    const hasCustomHeader = req.headers['x-requested-with'] || req.headers['x-csrf-token'] || req.headers['x-requested-by'] || req.headers['x-request-id'];

    // 1. Content-Type check (prevents simple form submissions)
    if (req.headers['content-length'] && parseInt(req.headers['content-length']) > 0 && !ct.includes('application/json')) {
      return next(new ForbiddenError('Content-Type must be application/json'));
    }

    // 2. Custom header check (prevents cross-origin browser requests without preflight)
    if (!hasCustomHeader && env.NODE_ENV === 'production') {
      return next(new ForbiddenError('CSRF Protection: Custom header missing'));
    }
  }
  next();
};

module.exports = {
  securityHeaders,
  csrfProtection,
  mongoSanitize: mongoSanitize(),
};

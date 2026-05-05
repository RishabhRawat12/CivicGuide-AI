const winston = require('winston');
const env = require('../config/env');

/**
 * Global Error Handler
 * Ensures sensitive internal details (stack traces, specific DB errors)
 * are never leaked to the client in production.
 */
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  const isProduction = env.NODE_ENV === 'production';

  // 1. Structured logging for observability (Cloud Logging / Winston)
  // We log the FULL error details internally for debugging
  winston.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    user: req.user?.uid,
    timestamp: new Date().toISOString(),
  });

  // 2. Client Response (Sanitized)
  const response = {
    success: false,
    error: isProduction ? getGenericMessage(statusCode, err) : err.message,
  };

  // Attach stack trace only in development
  if (!isProduction) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

/**
 * Returns a safe, user-friendly message based on status code.
 */
function getGenericMessage(statusCode, err) {
  // If the error has a 'isPublic' flag or similar, we might trust its message
  if (err.isOperational || err.isPublic) {
    return err.message;
  }

  switch (statusCode) {
    case 400: return 'Bad Request: Please check your input.';
    case 401: return 'Unauthorized: Please login to continue.';
    case 403: return 'Forbidden: You do not have permission to access this resource.';
    case 404: return 'Resource Not Found.';
    case 413: return 'Payload too large.';
    case 429: return 'Too many requests. Please try again later.';
    default: return 'An internal server error occurred. Please try again later.';
  }
}

module.exports = { errorHandler };

/**
 * @fileoverview Async Handler Utility
 * Wraps async route handlers to eliminate try/catch boilerplate.
 * Any thrown error is automatically forwarded to Express error middleware.
 *
 * @module utils/asyncHandler
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { asyncHandler };

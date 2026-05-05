/**
 * @fileoverview Request ID Middleware
 * Assigns a unique ID to every request for distributed tracing.
 * Respects incoming X-Request-Id header from load balancers.
 *
 * @module middlewares/requestId
 */
const crypto = require('crypto');
const { storage } = require('../utils/logger');

const requestId = (req, res, next) => {
  const id = req.headers['x-request-id'] || crypto.randomUUID();
  req.id = id;
  res.setHeader('X-Request-Id', id);

  // Run subsequent middlewares and routes in the context of this ID
  storage.run(id, () => {
    next();
  });
};

module.exports = { requestId };

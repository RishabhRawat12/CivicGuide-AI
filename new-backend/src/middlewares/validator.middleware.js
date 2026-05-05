/**
 * @fileoverview Request Validation Middleware
 */
const { ValidationError } = require('../utils/errors');

/**
 * Validates request data against a Zod schema
 * @param {import('zod').ZodSchema} schema
 * @param {('body'|'query'|'params')} source - The part of the request to validate
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const result = schema.parse(req[source]);
      req[source] = result;
      next();
    } catch (error) {
      const details = error.errors
        ? error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
        : error.message;
      next(new ValidationError(details));
    }
  };
};

module.exports = { validate };

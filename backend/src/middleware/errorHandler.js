import { logger } from '../lib/logger.js';

export function errorHandler(err, _req, res, _next) {
  logger.error('request_error', { message: err.message, stack: err.stack });
  const status = err.status || 500;
  res.status(status).json({
    error: err.code || 'internal_error',
    message: err.publicMessage || err.message || 'Unexpected error',
  });
}

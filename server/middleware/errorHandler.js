/**
 * middleware/errorHandler.js
 * Global Express error handler. Must be registered last (after all routes).
 */

function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  const statusCode = err.statusCode || err.status || 500;
  const isDev = process.env.NODE_ENV !== 'production';

  console.error('[Error]', {
    message: err.message,
    path: req.path,
    method: req.method,
    ...(isDev && { stack: err.stack }),
  });

  res.status(statusCode).json({
    error: err.message || 'Internal Server Error',
    ...(isDev && { stack: err.stack }),
  });
}

module.exports = errorHandler;

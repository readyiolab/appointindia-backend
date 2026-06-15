const logger = require('../config/logger');

function requestLogger(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;

    logger.info('Request completed', {
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: duration,
      requestId: req.headers['x-request-id'] || null,
    });
  });

  next();
}

module.exports = { requestLogger };

const logger = require('../config/logger');
const AppError = require('../common/errors/AppError');

function errorHandler(err, req, res, _next) {
  logger.error('Unhandled error', {
    error: err instanceof Error ? err.message : err,
    stack: err instanceof Error ? err.stack : undefined,
    path: req.originalUrl,
  });

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  }

  if (err && err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({
      success: false,
      message: 'Invalid company or recruiter reference',
      errors: [{ field: 'companyId', reason: 'Linked company or recruiter record was not found' }],
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  }

  return res.status(500).json({
    success: false,
    message: 'Internal server error',
    errors: [],
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
}

module.exports = { errorHandler };

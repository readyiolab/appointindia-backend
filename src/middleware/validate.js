const AppError = require('../common/errors/AppError');

function validate(schema, source = 'body') {
  return (req, res, next) => {
    const payload = source === 'query' ? req.query : req.body;
    const result = schema.safeParse(payload);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        reason: issue.message,
      }));

      return next(new AppError('Validation failed', 400, errors));
    }

    if (source === 'query') {
      req.query = result.data;
    } else {
      req.body = result.data;
    }

    next();
  };
}

module.exports = { validate };

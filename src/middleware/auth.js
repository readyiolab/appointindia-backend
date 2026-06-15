const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const AppError = require('../common/errors/AppError');

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Unauthorized', 401, [{ field: 'authorization', reason: 'Bearer token is required' }]));
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);
    req.user = payload;
    next();
  } catch (error) {
    return next(new AppError('Invalid or expired token', 401, [{ field: 'token', reason: 'Access token verification failed' }]));
  }
}

module.exports = { authenticate };

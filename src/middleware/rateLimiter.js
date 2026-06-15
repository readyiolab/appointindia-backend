const rateLimit = require('express-rate-limit');
const { env } = require('../config/env');
const { getRedisClient } = require('../config/redis');

const inMemoryLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
});

async function generalRateLimiter(req, res, next) {
  try {
    const redis = getRedisClient();
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const key = `ratelimit:${ip}`;

    const requests = await redis.incr(key);
    if (requests === 1) {
      await redis.expire(key, Math.ceil(env.RATE_LIMIT_WINDOW_MS / 1000));
    }

    if (requests > env.RATE_LIMIT_MAX) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests, please try again later.',
        errors: [{ field: 'rateLimit', reason: 'IP rate limit exceeded' }],
        meta: { timestamp: new Date().toISOString() },
      });
    }

    next();
  } catch (error) {
    return inMemoryLimiter(req, res, next);
  }
}

module.exports = { generalRateLimiter };

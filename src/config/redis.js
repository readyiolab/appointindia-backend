const Redis = require('ioredis');
const logger = require('./logger');
const { env } = require('./env');

let redisClient;

function resolveRedisOptions() {
  if (env.REDIS_URL) {
    return env.REDIS_URL;
  }

  if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
    const host = new URL(env.UPSTASH_REDIS_REST_URL).hostname;

    return {
      host,
      port: 6379,
      password: env.UPSTASH_REDIS_REST_TOKEN,
      tls: {},
      maxRetriesPerRequest: 3,
    };
  }

  return {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
    maxRetriesPerRequest: 3,
  };
}

function createRedisClient() {
  if (redisClient) {
    return redisClient;
  }

  const options = resolveRedisOptions();

  redisClient =
    typeof options === 'string'
      ? new Redis(options, { lazyConnect: true, maxRetriesPerRequest: 3 })
      : new Redis({ ...options, lazyConnect: true });

  redisClient.on('connect', () => logger.info('Redis connected'));
  redisClient.on('error', (error) => logger.error('Redis error', { error: error.message }));

  return redisClient.connect().then(() => redisClient);
}

function getRedisClient() {
  if (!redisClient) {
    throw new Error('Redis client has not been initialized');
  }

  return redisClient;
}

module.exports = { createRedisClient, getRedisClient };

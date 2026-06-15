const app = require('./app');
const { env } = require('./config/env');
const logger = require('./config/logger');
const { createMysqlPool } = require('./config/mysql');
const { createRedisClient } = require('./config/redis');

async function bootstrap() {
  try {
    await createMysqlPool();
    await createRedisClient();

    const server = app.listen(env.PORT, () => {
      logger.info('Job portal backend started', {
        port: env.PORT,
        env: env.NODE_ENV,
      });
    });

    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down');
      server.close(() => process.exit(0));
    });
  } catch (error) {
    logger.error('Failed to bootstrap application', {
      error: error instanceof Error ? error.message : error,
    });
    process.exit(1);
  }
}

bootstrap();

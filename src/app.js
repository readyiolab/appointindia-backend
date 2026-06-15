require('dotenv').config();

const compression = require('compression');
const cors = require('cors');
const express = require('express');
const helmet = require('helmet');

const { env } = require('./config/env');
const logger = require('./config/logger');
const { swaggerMiddleware, swaggerSetup } = require('./config/swagger');
const { requestLogger } = require('./middleware/requestLogger');
const { generalRateLimiter } = require('./middleware/rateLimiter');
const { errorHandler } = require('./middleware/errorHandler');
const routes = require('./routes');

const app = express();

app.use(helmet());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: env.CORS_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  })
);

app.use(generalRateLimiter);
app.use(requestLogger);

app.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Job portal API is healthy',
    data: { status: 'ok' },
  });
});

app.get('/ready', async (_req, res) => {
  res.json({
    success: true,
    message: 'Service is ready',
    data: { status: 'ready' },
  });
});

app.use('/api-docs', swaggerMiddleware, swaggerSetup);
app.use('/api', routes);

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    errors: [{ field: 'route', reason: 'Requested endpoint does not exist' }],
  });
});

app.use(errorHandler);

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled rejection', { error: err instanceof Error ? err.message : err });
});

process.on('uncaughtException', (err) => {
  logger.error('Unhandled exception', { error: err instanceof Error ? err.message : err });
  process.exit(1);
});

module.exports = app;

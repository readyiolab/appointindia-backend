const mysql = require('mysql2/promise');
const logger = require('./logger');
const { env } = require('./env');

let pool;

async function createMysqlPool() {
  if (pool) {
    return pool;
  }

  pool = mysql.createPool({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    waitForConnections: true,
    connectionLimit: env.DB_CONNECTION_LIMIT,
    queueLimit: 100,
    timezone: 'Z',
  });

  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    logger.info('MySQL pool connected');
  } catch (error) {
    logger.error('Failed to connect to MySQL', {
      error: error instanceof Error ? error.message : error,
    });
    throw error;
  }

  return pool;
}

function getPool() {
  if (!pool) {
    throw new Error('MySQL pool has not been initialized');
  }

  return pool;
}

module.exports = { createMysqlPool, getPool };

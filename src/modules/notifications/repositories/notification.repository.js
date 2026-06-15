const { v4: uuidv4 } = require('uuid');
const { getPool } = require('../../../config/mysql');

async function createNotification(payload) {
  const pool = getPool();
  const id = uuidv4();

  await pool.query(
    `INSERT INTO notifications (id, user_id, title, message, is_read, created_at, updated_at, created_by, updated_by)
     VALUES (?, ?, ?, ?, 0, NOW(), NOW(), ?, ?)`,
    [id, payload.userId, payload.title, payload.message, payload.createdBy, payload.createdBy]
  );

  return id;
}

async function findByUser(userId) {
  const pool = getPool();
  const [rows] = await pool.query('SELECT * FROM notifications WHERE user_id = ? AND deleted_at IS NULL ORDER BY created_at DESC', [userId]);
  return rows;
}

async function markRead(id) {
  const pool = getPool();
  await pool.query('UPDATE notifications SET is_read = 1, updated_at = NOW() WHERE id = ?', [id]);
  return true;
}

module.exports = { createNotification, findByUser, markRead };

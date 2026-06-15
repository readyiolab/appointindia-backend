const { getPool } = require('../../../config/mysql');

async function listUsers() {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT id, email, phone, role, status, email_verified, created_at, updated_at
     FROM users WHERE deleted_at IS NULL ORDER BY created_at DESC`
  );
  return rows;
}

async function updateStatus(id, status) {
  const pool = getPool();
  await pool.query('UPDATE users SET status = ?, updated_at = NOW() WHERE id = ?', [status, id]);
  return true;
}

module.exports = { listUsers, updateStatus };

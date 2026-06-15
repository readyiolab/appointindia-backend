const { getPool } = require('../../../config/mysql');
const { camelToSnakeKeys } = require('../../../common/case');

async function findById(id) {
  const pool = getPool();
  const [rows] = await pool.query('SELECT id, email, phone, password_hash, role, status, email_verified, created_at, updated_at FROM users WHERE id = ? AND deleted_at IS NULL LIMIT 1', [id]);
  return rows[0];
}

async function updateUser(id, data) {
  const pool = getPool();
  const snakeData = camelToSnakeKeys(data);
  const fields = Object.keys(snakeData);
  const values = Object.values(snakeData);

  if (!fields.length) {
    return null;
  }

  const setClause = fields.map((field) => `${field} = ?`).join(', ');
  await pool.query(`UPDATE users SET ${setClause}, updated_at = NOW() WHERE id = ?`, [...values, id]);
  return findById(id);
}

async function updatePassword(id, passwordHash) {
  const pool = getPool();
  await pool.query('UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?', [passwordHash, id]);
}

module.exports = { findById, updateUser, updatePassword };

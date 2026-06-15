const { getPool } = require('../../../config/mysql');

async function findUserByEmail(email) {
  const pool = getPool();
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ? AND deleted_at IS NULL LIMIT 1', [email]);
  return rows[0];
}

async function createUser(userData) {
  const pool = getPool();
  const [result] = await pool.query(
    'INSERT INTO users (id, email, password_hash, role, status, email_verified, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
    [userData.id, userData.email, userData.password_hash, userData.role, 'active', 1]
  );

  return result.insertId;
}

async function updateFailedAttempts(userId, attempts, lockUntil) {
  const pool = getPool();
  await pool.query(
    'UPDATE users SET failed_login_attempts = ?, lock_until = ?, updated_at = NOW() WHERE id = ?',
    [attempts, lockUntil, userId]
  );
}

async function resetFailedAttempts(userId) {
  const pool = getPool();
  await pool.query(
    'UPDATE users SET failed_login_attempts = 0, lock_until = NULL, updated_at = NOW() WHERE id = ?',
    [userId]
  );
}

async function saveRefreshToken(tokenData) {
  const pool = getPool();
  await pool.query(
    'INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
    [tokenData.id, tokenData.userId, tokenData.tokenHash, tokenData.expiresAt]
  );
}

async function findRefreshToken(id) {
  const pool = getPool();
  const [rows] = await pool.query('SELECT * FROM refresh_tokens WHERE id = ? LIMIT 1', [id]);
  return rows[0];
}

async function revokeRefreshToken(id, replacedBy = null) {
  const pool = getPool();
  await pool.query(
    'UPDATE refresh_tokens SET revoked_at = NOW(), replaced_by = ?, updated_at = NOW() WHERE id = ?',
    [replacedBy, id]
  );
}

module.exports = { findUserByEmail, createUser, updateFailedAttempts, resetFailedAttempts, saveRefreshToken, findRefreshToken, revokeRefreshToken };

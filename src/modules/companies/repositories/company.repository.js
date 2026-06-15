const { v4: uuidv4 } = require('uuid');
const { getPool } = require('../../../config/mysql');
const { camelToSnakeKeys } = require('../../../common/case');

async function createCompany(payload) {
  const pool = getPool();
  const id = uuidv4();

  await pool.query(
    `INSERT INTO companies (id, name, website, industry, size, location, description, logo_url, verification_status, is_active, created_at, updated_at, created_by, updated_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', 1, NOW(), NOW(), ?, ?)`,
    [id, payload.name, payload.website, payload.industry, payload.size, payload.location, payload.description, payload.logoUrl, payload.createdBy, payload.createdBy]
  );

  return id;
}

async function findById(id) {
  const pool = getPool();
  const [rows] = await pool.query('SELECT * FROM companies WHERE id = ? AND deleted_at IS NULL LIMIT 1', [id]);
  return rows[0];
}

async function updateCompany(id, payload) {
  const pool = getPool();
  const snakePayload = camelToSnakeKeys(payload);
  const fields = Object.keys(snakePayload);
  const values = Object.values(snakePayload);

  if (!fields.length) {
    return findById(id);
  }

  const setClause = fields.map((field) => `${field} = ?`).join(', ');
  await pool.query(`UPDATE companies SET ${setClause}, updated_at = NOW() WHERE id = ?`, [...values, id]);
  return findById(id);
}

module.exports = { createCompany, findById, updateCompany };

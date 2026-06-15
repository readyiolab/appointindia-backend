const { v4: uuidv4 } = require('uuid');
const { getPool } = require('../../../config/mysql');
const { camelToSnakeKeys } = require('../../../common/case');

async function createRecruiter(payload) {
  const pool = getPool();
  const id = uuidv4();

  await pool.query(
    `INSERT INTO recruiters (id, user_id, company_id, first_name, last_name, designation, phone, is_active, created_at, updated_at, created_by, updated_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW(), ?, ?)`,
    [id, payload.userId, payload.companyId, payload.firstName, payload.lastName, payload.designation, payload.phone, payload.createdBy, payload.createdBy]
  );

  return id;
}

async function findById(id) {
  const pool = getPool();
  const [rows] = await pool.query('SELECT * FROM recruiters WHERE id = ? AND deleted_at IS NULL LIMIT 1', [id]);
  return rows[0];
}

async function findByUserId(userId) {
  const pool = getPool();
  const [rows] = await pool.query('SELECT * FROM recruiters WHERE user_id = ? AND deleted_at IS NULL LIMIT 1', [userId]);
  return rows[0];
}

async function updateRecruiter(id, payload) {
  const pool = getPool();
  const snakePayload = camelToSnakeKeys(payload);
  const fields = Object.keys(snakePayload);
  const values = Object.values(snakePayload);

  if (!fields.length) {
    return findById(id);
  }

  const setClause = fields.map((field) => `${field} = ?`).join(', ');
  await pool.query(`UPDATE recruiters SET ${setClause}, updated_at = NOW() WHERE id = ?`, [...values, id]);
  return findById(id);
}

module.exports = { createRecruiter, findById, findByUserId, updateRecruiter };

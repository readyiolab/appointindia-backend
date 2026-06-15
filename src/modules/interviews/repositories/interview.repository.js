const { v4: uuidv4 } = require('uuid');
const { getPool } = require('../../../config/mysql');
const { camelToSnakeKeys } = require('../../../common/case');

async function createInterview(payload) {
  const pool = getPool();
  const id = uuidv4();

  await pool.query(
    `INSERT INTO interviews (id, application_id, candidate_id, recruiter_id, scheduled_at, mode, location, status, notes, created_at, updated_at, created_by, updated_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'scheduled', ?, NOW(), NOW(), ?, ?)`,
    [id, payload.applicationId, payload.candidateId, payload.recruiterId, payload.scheduledAt, payload.mode, payload.location, payload.notes, payload.createdBy, payload.createdBy]
  );

  return id;
}

async function findByCandidate(candidateId) {
  const pool = getPool();
  const [rows] = await pool.query('SELECT * FROM interviews WHERE candidate_id = ? AND deleted_at IS NULL ORDER BY scheduled_at DESC', [candidateId]);
  return rows;
}

async function updateInterview(id, payload) {
  const pool = getPool();
  const snakePayload = camelToSnakeKeys(payload);
  const fields = Object.keys(snakePayload);
  const values = Object.values(snakePayload);

  if (!fields.length) {
    return true;
  }

  const setClause = fields.map((field) => `${field} = ?`).join(', ');
  await pool.query(`UPDATE interviews SET ${setClause}, updated_at = NOW() WHERE id = ?`, [...values, id]);
  return true;
}

module.exports = { createInterview, findByCandidate, updateInterview };

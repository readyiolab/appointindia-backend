const { v4: uuidv4 } = require('uuid');
const { getPool } = require('../../../config/mysql');

async function saveJob(payload) {
  const pool = getPool();
  const id = uuidv4();

  await pool.query(
    `INSERT INTO saved_jobs (id, candidate_id, job_id, created_at, updated_at, created_by, updated_by)
     VALUES (?, ?, ?, NOW(), NOW(), ?, ?)`,
    [id, payload.candidateId, payload.jobId, payload.createdBy, payload.createdBy]
  );

  return id;
}

async function findByCandidate(candidateId) {
  const pool = getPool();
  const [rows] = await pool.query('SELECT * FROM saved_jobs WHERE candidate_id = ? AND deleted_at IS NULL ORDER BY created_at DESC', [candidateId]);
  return rows;
}

async function deleteSavedJob(id) {
  const pool = getPool();
  await pool.query('UPDATE saved_jobs SET deleted_at = NOW(), updated_at = NOW() WHERE id = ?', [id]);
  return true;
}

module.exports = { saveJob, findByCandidate, deleteSavedJob };

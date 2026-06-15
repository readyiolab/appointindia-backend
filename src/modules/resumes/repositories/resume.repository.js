const { v4: uuidv4 } = require('uuid');
const { getPool } = require('../../../config/mysql');

async function createResume(payload) {
  const pool = getPool();
  const id = uuidv4();

  await pool.query(
    `INSERT INTO resumes (id, candidate_id, file_name, s3_key, file_type, file_size, checksum, virus_scan_status, is_primary, created_at, updated_at, created_by, updated_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', 1, NOW(), NOW(), ?, ?)`,
    [id, payload.candidateId, payload.fileName, payload.s3Key, payload.fileType, payload.fileSize, payload.checksum, payload.createdBy, payload.createdBy]
  );

  return id;
}

async function findByCandidate(candidateId) {
  const pool = getPool();
  const [rows] = await pool.query('SELECT * FROM resumes WHERE candidate_id = ? AND deleted_at IS NULL ORDER BY created_at DESC', [candidateId]);
  return rows;
}

async function deleteResume(id) {
  const pool = getPool();
  await pool.query('UPDATE resumes SET deleted_at = NOW(), updated_at = NOW() WHERE id = ?', [id]);
  return true;
}

module.exports = { createResume, findByCandidate, deleteResume };

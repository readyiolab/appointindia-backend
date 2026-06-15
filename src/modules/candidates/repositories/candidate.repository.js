const { v4: uuidv4 } = require('uuid');
const { getPool } = require('../../../config/mysql');

async function findByUserId(userId) {
  const pool = getPool();
  const [rows] = await pool.query('SELECT * FROM candidates WHERE user_id = ? AND deleted_at IS NULL LIMIT 1', [userId]);
  return rows[0];
}

async function upsertCandidate(userId, payload) {
  const pool = getPool();
  const existing = await findByUserId(userId);

  if (existing) {
    await pool.query(
      `UPDATE candidates SET first_name = ?, last_name = ?, headline = ?, current_location = ?, preferred_location = ?, total_experience_years = ?, current_salary = ?, expected_salary = ?, summary = ?, updated_at = NOW(), updated_by = ? WHERE id = ?`,
      [payload.firstName, payload.lastName, payload.headline, payload.currentLocation, payload.preferredLocation, payload.totalExperienceYears, payload.currentSalary, payload.expectedSalary, payload.summary, userId, existing.id]
    );
    return findByUserId(userId);
  }

  const candidateId = uuidv4();
  await pool.query(
    `INSERT INTO candidates (id, user_id, first_name, last_name, headline, current_location, preferred_location, total_experience_years, current_salary, expected_salary, summary, profile_completion_pct, is_active, created_at, updated_at, created_by, updated_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 50, 1, NOW(), NOW(), ?, ?)`,
    [candidateId, userId, payload.firstName, payload.lastName, payload.headline, payload.currentLocation, payload.preferredLocation, payload.totalExperienceYears, payload.currentSalary, payload.expectedSalary, payload.summary, userId, userId]
  );

  return findByUserId(userId);
}

module.exports = { findByUserId, upsertCandidate };

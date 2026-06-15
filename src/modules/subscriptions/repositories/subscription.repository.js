const { v4: uuidv4 } = require('uuid');
const { getPool } = require('../../../config/mysql');

async function listPlans() {
  const pool = getPool();
  const [rows] = await pool.query('SELECT * FROM plans WHERE deleted_at IS NULL ORDER BY created_at DESC');
  return rows;
}

async function createSubscription(payload) {
  const pool = getPool();
  const id = uuidv4();

  await pool.query(
    `INSERT INTO subscriptions (id, recruiter_id, plan_id, status, started_at, expires_at, created_at, updated_at, created_by, updated_by)
     VALUES (?, ?, ?, 'active', NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), NOW(), NOW(), ?, ?)`,
    [id, payload.recruiterId, payload.planId, payload.createdBy, payload.createdBy]
  );

  return id;
}

module.exports = { listPlans, createSubscription };

const { v4: uuidv4 } = require('uuid');
const { getPool } = require('../../../config/mysql');

async function createApplication(payload) {
  const pool = getPool();
  const id = uuidv4();

  await pool.query(
    `INSERT INTO job_applications (id, job_id, candidate_id, resume_id, status, applied_at, created_at, updated_at, created_by, updated_by)
     VALUES (?, ?, ?, ?, 'applied', NOW(), NOW(), NOW(), ?, ?)`,
    [id, payload.jobId, payload.candidateId, payload.resumeId, payload.createdBy, payload.createdBy]
  );

  await pool.query('UPDATE jobs SET application_count = application_count + 1 WHERE id = ?', [payload.jobId]);

  return id;
}

async function findByCandidate(candidateId) {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT ja.*, j.title AS job_title, j.work_mode, j.location, co.name AS company_name
     FROM job_applications ja
     INNER JOIN jobs j ON ja.job_id = j.id
     LEFT JOIN companies co ON j.company_id = co.id
     WHERE ja.candidate_id = ? AND ja.deleted_at IS NULL
     ORDER BY ja.applied_at DESC`,
    [candidateId]
  );
  return rows;
}

async function findById(id) {
  const pool = getPool();
  const [rows] = await pool.query('SELECT * FROM job_applications WHERE id = ? AND deleted_at IS NULL LIMIT 1', [id]);
  return rows[0];
}

async function findByJobAndCandidate(jobId, candidateId) {
  const pool = getPool();
  const [rows] = await pool.query(
    'SELECT * FROM job_applications WHERE job_id = ? AND candidate_id = ? AND deleted_at IS NULL LIMIT 1',
    [jobId, candidateId]
  );
  return rows[0];
}

async function findPipelineItemById(id) {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT
      ja.id,
      ja.job_id,
      ja.candidate_id,
      ja.resume_id,
      ja.status,
      ja.applied_at,
      ja.recruiter_notes,
      j.title AS job_title,
      j.work_mode,
      j.location,
      j.job_type,
      co.name AS company_name,
      c.first_name,
      c.last_name,
      c.headline,
      c.total_experience_years,
      u.email AS candidate_email
    FROM job_applications ja
    INNER JOIN jobs j ON ja.job_id = j.id
    INNER JOIN candidates c ON ja.candidate_id = c.id
    INNER JOIN users u ON c.user_id = u.id
    LEFT JOIN companies co ON j.company_id = co.id
    WHERE ja.id = ? AND ja.deleted_at IS NULL
    LIMIT 1`,
    [id]
  );
  return rows[0];
}

async function updateStatus(id, status) {
  const pool = getPool();
  await pool.query('UPDATE job_applications SET status = ?, updated_at = NOW() WHERE id = ?', [status, id]);
  return findById(id);
}

function buildRecruiterPipelineWhere(recruiterId, filters) {
  const conditions = ['j.recruiter_id = ?', 'ja.deleted_at IS NULL', 'j.deleted_at IS NULL'];
  const params = [recruiterId];

  if (filters.jobId) {
    conditions.push('ja.job_id = ?');
    params.push(filters.jobId);
  }

  if (filters.status) {
    conditions.push('ja.status = ?');
    params.push(filters.status);
  }

  if (filters.workMode) {
    conditions.push('j.work_mode = ?');
    params.push(filters.workMode);
  }

  if (filters.search) {
    conditions.push(`(
      CONCAT(IFNULL(c.first_name, ''), ' ', IFNULL(c.last_name, '')) LIKE ?
      OR IFNULL(c.headline, '') LIKE ?
      OR u.email LIKE ?
      OR j.title LIKE ?
    )`);
    const term = `%${filters.search}%`;
    params.push(term, term, term, term);
  }

  return { where: conditions.join(' AND '), params };
}

async function findRecruiterPipeline(recruiterId, filters) {
  const pool = getPool();
  const { where, params } = buildRecruiterPipelineWhere(recruiterId, filters);
  const limit = Number(filters.limit || 20);
  const offset = Number(filters.offset || 0);

  const baseFrom = `
    FROM job_applications ja
    INNER JOIN jobs j ON ja.job_id = j.id
    INNER JOIN candidates c ON ja.candidate_id = c.id
    INNER JOIN users u ON c.user_id = u.id
    LEFT JOIN companies co ON j.company_id = co.id
    WHERE ${where}
  `;

  const [countRows] = await pool.query(`SELECT COUNT(*) AS total ${baseFrom}`, params);

  const [rows] = await pool.query(
    `SELECT
      ja.id,
      ja.job_id,
      ja.candidate_id,
      ja.resume_id,
      ja.status,
      ja.applied_at,
      ja.recruiter_notes,
      j.title AS job_title,
      j.work_mode,
      j.location,
      j.job_type,
      co.name AS company_name,
      c.first_name,
      c.last_name,
      c.headline,
      c.total_experience_years,
      u.email AS candidate_email
    ${baseFrom}
    ORDER BY ja.applied_at DESC
    LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return { items: rows, total: countRows[0]?.total || 0 };
}

async function getRecruiterPipelineStats(recruiterId, filters) {
  const pool = getPool();
  const { where, params } = buildRecruiterPipelineWhere(recruiterId, { ...filters, status: undefined });

  const [statusRows] = await pool.query(
    `SELECT ja.status, COUNT(*) AS count
     FROM job_applications ja
     INNER JOIN jobs j ON ja.job_id = j.id
     INNER JOIN candidates c ON ja.candidate_id = c.id
     INNER JOIN users u ON c.user_id = u.id
     WHERE ${where}
     GROUP BY ja.status`,
    params
  );

  const [workModeRows] = await pool.query(
    `SELECT j.work_mode, COUNT(*) AS count
     FROM job_applications ja
     INNER JOIN jobs j ON ja.job_id = j.id
     INNER JOIN candidates c ON ja.candidate_id = c.id
     INNER JOIN users u ON c.user_id = u.id
     WHERE ${where}
     GROUP BY j.work_mode`,
    params
  );

  return { byStatus: statusRows, byWorkMode: workModeRows };
}

async function getRecruiterJobSummaries(recruiterId) {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT
      j.id,
      j.title,
      j.work_mode,
      j.location,
      j.status,
      j.posted_at,
      j.application_count,
      COUNT(ja.id) AS applicant_count,
      SUM(CASE WHEN ja.status = 'hired' THEN 1 ELSE 0 END) AS hired_count
    FROM jobs j
    LEFT JOIN job_applications ja ON ja.job_id = j.id AND ja.deleted_at IS NULL
    WHERE j.recruiter_id = ? AND j.deleted_at IS NULL
    GROUP BY j.id
    ORDER BY j.posted_at DESC`,
    [recruiterId]
  );

  return rows;
}

module.exports = {
  createApplication,
  findByCandidate,
  findById,
  findByJobAndCandidate,
  findPipelineItemById,
  updateStatus,
  findRecruiterPipeline,
  getRecruiterPipelineStats,
  getRecruiterJobSummaries,
};

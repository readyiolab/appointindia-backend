const { getPool } = require('../../../config/mysql');
const { camelToSnakeKeys } = require('../../../common/case');

async function createJob(jobData) {
  const pool = getPool();
  const [result] = await pool.query(
    'INSERT INTO jobs (id, company_id, recruiter_id, title, description, job_type, work_mode, location, city, state, country, min_salary, max_salary, min_experience_years, max_experience_years, expires_at, status, posted_at, created_at, updated_at, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW(), ?, ?)',
    [
      jobData.id,
      jobData.companyId,
      jobData.recruiterId,
      jobData.title,
      jobData.description,
      jobData.jobType,
      jobData.workMode,
      jobData.location,
      jobData.city,
      jobData.state,
      jobData.country,
      jobData.minSalary,
      jobData.maxSalary,
      jobData.minExperienceYears,
      jobData.maxExperienceYears,
      jobData.expiresAt,
      jobData.status || 'published',
      jobData.createdBy,
      jobData.updatedBy,
    ]
  );

  return result.insertId;
}

async function findJobById(id) {
  const pool = getPool();
  const [rows] = await pool.query('SELECT * FROM jobs WHERE id = ? AND deleted_at IS NULL LIMIT 1', [id]);
  return rows[0];
}

async function searchJobs(filters) {
  const pool = getPool();
  const sql = `
    SELECT id, title, company_id, recruiter_id, location, job_type, work_mode, min_salary, max_salary, posted_at, description
    FROM jobs
    WHERE deleted_at IS NULL AND status = 'published' AND expires_at > NOW()
    ${filters.location ? 'AND location = ?' : ''}
    ${filters.jobType ? 'AND job_type = ?' : ''}
    ORDER BY posted_at DESC
    LIMIT ? OFFSET ?
  `;

  const params = [];
  if (filters.location) params.push(filters.location);
  if (filters.jobType) params.push(filters.jobType);
  params.push(filters.limit, filters.offset);

  const [rows] = await pool.query(sql, params);
  return rows;
}

async function updateJob(id, payload) {
  const pool = getPool();
  const snakePayload = camelToSnakeKeys(payload);
  const fields = Object.keys(snakePayload);
  const values = Object.values(snakePayload);

  if (!fields.length) {
    return findJobById(id);
  }

  const setClause = fields.map((field) => `${field} = ?`).join(', ');
  await pool.query(`UPDATE jobs SET ${setClause}, updated_at = NOW() WHERE id = ?`, [...values, id]);
  return findJobById(id);
}

module.exports = { createJob, findJobById, searchJobs, updateJob };

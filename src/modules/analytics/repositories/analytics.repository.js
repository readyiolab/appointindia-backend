const { getPool } = require('../../../config/mysql');

async function getSummary() {
  const pool = getPool();
  const [jobs] = await pool.query('SELECT COUNT(*) AS totalJobs FROM jobs WHERE deleted_at IS NULL');
  const [applications] = await pool.query('SELECT COUNT(*) AS totalApplications FROM job_applications WHERE deleted_at IS NULL');
  const [candidates] = await pool.query('SELECT COUNT(*) AS totalCandidates FROM candidates WHERE deleted_at IS NULL');

  return {
    totalJobs: jobs[0].totalJobs,
    totalApplications: applications[0].totalApplications,
    totalCandidates: candidates[0].totalCandidates,
  };
}

module.exports = { getSummary };

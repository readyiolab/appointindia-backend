const { v4: uuidv4 } = require('uuid');
const AppError = require('../../../common/errors/AppError');
const { toMySQLDatetime } = require('../../../common/datetime');
const companyRepository = require('../../companies/repositories/company.repository');
const recruiterRepository = require('../../recruiters/repositories/recruiter.repository');
const jobRepository = require('../repositories/job.repository');

const PLACEHOLDER_UUID = '00000000-0000-0000-0000-000000000000';

function isProvidedId(id) {
  return Boolean(id && id !== PLACEHOLDER_UUID);
}

async function resolveRecruiterContext(user, payload) {
  let companyId = isProvidedId(payload.companyId) ? payload.companyId : null;
  let recruiterId = isProvidedId(payload.recruiterId) ? payload.recruiterId : null;

  if (companyId) {
    const company = await companyRepository.findById(companyId);
    if (!company) {
      companyId = null;
    }
  }

  if (!companyId) {
    const emailPrefix = user.email?.split('@')[0] || 'My';
    companyId = await companyRepository.createCompany({
      name: payload.companyName || `${emailPrefix} Company`,
      industry: 'General',
      size: '1-10',
      location: payload.location || 'India',
      description: null,
      createdBy: user.id,
    });
  }

  let recruiter = null;

  if (recruiterId) {
    recruiter = await recruiterRepository.findById(recruiterId);
  }

  if (!recruiter) {
    recruiter = await recruiterRepository.findByUserId(user.id);
  }

  if (!recruiter) {
    recruiterId = await recruiterRepository.createRecruiter({
      userId: user.id,
      companyId,
      firstName: emailPrefixFrom(user.email),
      lastName: 'Recruiter',
      designation: 'Recruiter',
      phone: null,
      createdBy: user.id,
    });
  } else {
    recruiterId = recruiter.id;
  }

  return { companyId, recruiterId };
}

function emailPrefixFrom(email) {
  const prefix = email?.split('@')[0] || 'Recruiter';
  return prefix.charAt(0).toUpperCase() + prefix.slice(1);
}

function mapJob(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    companyId: row.company_id,
    recruiterId: row.recruiter_id,
    title: row.title,
    description: row.description || '',
    location: row.location,
    city: row.city,
    state: row.state,
    country: row.country,
    jobType: row.job_type,
    workMode: row.work_mode,
    minSalary: row.min_salary != null ? Number(row.min_salary) : undefined,
    maxSalary: row.max_salary != null ? Number(row.max_salary) : undefined,
    minExperienceYears: row.min_experience_years,
    maxExperienceYears: row.max_experience_years,
    expiresAt: row.expires_at,
    status: row.status,
    postedAt: row.posted_at,
    applicationCount: row.application_count,
  };
}

async function createJob(payload, user) {
  if (!user) {
    throw new AppError('Unauthorized', 401, [{ field: 'user', reason: 'Authenticated user is required' }]);
  }

  const { companyId, recruiterId } = await resolveRecruiterContext(user, payload);

  const jobData = {
    id: uuidv4(),
    companyId,
    recruiterId,
    title: payload.title,
    description: payload.description,
    jobType: payload.jobType,
    workMode: payload.workMode,
    location: payload.location,
    city: payload.city,
    state: payload.state,
    country: payload.country,
    minSalary: payload.minSalary,
    maxSalary: payload.maxSalary,
    minExperienceYears: payload.minExperienceYears,
    maxExperienceYears: payload.maxExperienceYears,
    expiresAt: toMySQLDatetime(payload.expiresAt),
    status: payload.status || 'published',
    createdBy: user.id,
    updatedBy: user.id,
  };

  await jobRepository.createJob(jobData);

  return { id: jobData.id, message: 'Job created successfully' };
}

async function getById(id) {
  const job = await jobRepository.findJobById(id);

  if (!job) {
    throw new AppError('Job not found', 404, [{ field: 'id', reason: 'No job found for this id' }]);
  }

  return mapJob(job);
}

async function search(filters) {
  const rows = await jobRepository.searchJobs({
    location: filters.location,
    jobType: filters.jobType,
    limit: Number(filters.limit || 20),
    offset: Number(filters.offset || 0),
  });

  return rows.map((row) => ({
    id: row.id,
    companyId: row.company_id,
    recruiterId: row.recruiter_id,
    title: row.title,
    description: row.description || '',
    location: row.location,
    jobType: row.job_type,
    workMode: row.work_mode,
    minSalary: row.min_salary != null ? Number(row.min_salary) : undefined,
    maxSalary: row.max_salary != null ? Number(row.max_salary) : undefined,
    postedAt: row.posted_at,
  }));
}

async function updateJob(user, id, payload) {
  const job = await jobRepository.findJobById(id);

  if (!job) {
    throw new AppError('Job not found', 404, [{ field: 'id', reason: 'No job found for this id' }]);
  }

  // Ownership verification check:
  if (user.role !== 'admin') {
    const recruiter = await recruiterRepository.findByUserId(user.id);
    if (!recruiter) {
      throw new AppError('Forbidden', 403, [{ field: 'role', reason: 'Recruiter profile is required to edit a job' }]);
    }

    if (user.role === 'recruiter') {
      // Recruiter must own the job posting
      if (job.recruiter_id !== recruiter.id) {
        throw new AppError('Forbidden', 403, [{ field: 'id', reason: 'You can only update jobs you posted' }]);
      }
    } else if (user.role === 'company_admin') {
      // Company admin must match the company linked to the job
      if (job.company_id !== recruiter.company_id) {
        throw new AppError('Forbidden', 403, [{ field: 'id', reason: 'You can only update jobs posted by your company' }]);
      }
    } else {
      throw new AppError('Forbidden', 403, [{ field: 'role', reason: 'You do not have permission to update jobs' }]);
    }
  }

  const updates = { ...payload };
  delete updates.updatedBy; // We assign it explicitly below
  updates.updatedBy = user.id;

  if (payload.expiresAt !== undefined) {
    updates.expiresAt = toMySQLDatetime(payload.expiresAt);
  }

  return jobRepository.updateJob(id, updates);
}

module.exports = { createJob, getById, search, updateJob };

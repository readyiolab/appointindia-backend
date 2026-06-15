const AppError = require('../../../common/errors/AppError');
const candidateRepository = require('../../candidates/repositories/candidate.repository');
const recruiterRepository = require('../../recruiters/repositories/recruiter.repository');
const applicationRepository = require('../repositories/application.repository');

function ensureOwner(user, candidateId) {
  if (user.role !== 'admin' && candidateId !== user.id) {
    throw new AppError('Forbidden', 403, [{ field: 'candidateId', reason: 'You can only manage your own applications' }]);
  }
}

function mapPipelineRow(row) {
  const firstName = row.first_name || '';
  const lastName = row.last_name || '';
  const candidateName = `${firstName} ${lastName}`.trim() || 'Candidate';

  return {
    id: row.id,
    jobId: row.job_id,
    candidateId: row.candidate_id,
    resumeId: row.resume_id,
    status: row.status,
    appliedAt: row.applied_at,
    recruiterNotes: row.recruiter_notes,
    jobTitle: row.job_title,
    workMode: row.work_mode,
    location: row.location,
    jobType: row.job_type,
    companyName: row.company_name,
    candidateName,
    candidateEmail: row.candidate_email,
    candidateHeadline:
      row.headline ||
      (row.total_experience_years != null ? `${row.total_experience_years} yrs experience` : ''),
    totalExperienceYears: row.total_experience_years,
  };
}

async function resolveCandidateId(user, payloadCandidateId) {
  if (payloadCandidateId) {
    return payloadCandidateId;
  }

  if (user.role !== 'candidate' && user.role !== 'admin') {
    throw new AppError('Validation failed', 400, [{ field: 'candidateId', reason: 'Candidate id is required' }]);
  }

  let candidate = await candidateRepository.findByUserId(user.id);

  if (!candidate) {
    candidate = await candidateRepository.upsertCandidate(user.id, {
      firstName: user.email?.split('@')[0] || 'Candidate',
      lastName: '',
    });
  }

  return candidate.id;
}

async function createApplication(payload, user) {
  const candidateId = await resolveCandidateId(user, payload.candidateId);

  if (user.role === 'candidate') {
    const candidate = await candidateRepository.findByUserId(user.id);
    if (candidate && candidate.id !== candidateId) {
      throw new AppError('Forbidden', 403, [{ field: 'candidateId', reason: 'Invalid candidate profile' }]);
    }
  } else if (user.role !== 'admin') {
    ensureOwner(user, candidateId);
  }

  const existing = await applicationRepository.findByJobAndCandidate(payload.jobId, candidateId);

  if (existing) {
    throw new AppError('Already applied', 409, [
      { field: 'jobId', reason: 'You have already applied to this job' },
    ]);
  }

  const applicationId = await applicationRepository.createApplication({
    ...payload,
    candidateId,
    createdBy: user.id,
  });

  return { id: applicationId, status: 'applied', jobId: payload.jobId };
}

async function getMyApplications(user) {
  const candidate = await candidateRepository.findByUserId(user.id);

  if (!candidate) {
    return [];
  }

  const rows = await applicationRepository.findByCandidate(candidate.id);
  return rows.map(mapPipelineRow);
}

async function getRecruiterPipeline(user, query) {
  const recruiter = await recruiterRepository.findByUserId(user.id);

  if (!recruiter && user.role !== 'admin') {
    return {
      items: [],
      total: 0,
      page: Number(query.page || 1),
      limit: Number(query.limit || 20),
      totalPages: 0,
      stats: { byStatus: [], byWorkMode: [] },
      jobSummaries: [],
    };
  }

  const recruiterId = recruiter?.id;

  if (!recruiterId) {
    throw new AppError('Recruiter profile not found', 404, [{ field: 'recruiter', reason: 'No recruiter profile for this user' }]);
  }

  const page = Number(query.page || 1);
  const limit = Number(query.limit || 20);
  const offset = (page - 1) * limit;

  const filters = {
    jobId: query.jobId,
    status: query.status,
    workMode: query.workMode,
    search: query.search,
    limit,
    offset,
  };

  const [{ items, total }, stats, jobSummaries] = await Promise.all([
    applicationRepository.findRecruiterPipeline(recruiterId, filters),
    applicationRepository.getRecruiterPipelineStats(recruiterId, filters),
    applicationRepository.getRecruiterJobSummaries(recruiterId),
  ]);

  return {
    items: items.map(mapPipelineRow),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 0,
    stats: {
      byStatus: stats.byStatus,
      byWorkMode: stats.byWorkMode,
    },
    jobSummaries: jobSummaries.map((job) => ({
      id: job.id,
      title: job.title,
      workMode: job.work_mode,
      location: job.location,
      status: job.status,
      postedAt: job.posted_at,
      applicationCount: Number(job.applicant_count || 0),
      hiredCount: Number(job.hired_count || 0),
    })),
  };
}

async function updateStatus(user, id, payload) {
  if (!['recruiter', 'company_admin', 'admin'].includes(user.role)) {
    throw new AppError('Forbidden', 403, [{ field: 'role', reason: 'Only recruiters and admins can update application status' }]);
  }

  const application = await applicationRepository.findById(id);

  if (!application) {
    throw new AppError('Application not found', 404, [{ field: 'id', reason: 'No application found for this id' }]);
  }

  // Ownership verification check:
  if (user.role !== 'admin') {
    const recruiter = await recruiterRepository.findByUserId(user.id);
    if (!recruiter) {
      throw new AppError('Forbidden', 403, [{ field: 'role', reason: 'Recruiter profile is required to update application status' }]);
    }

    const linkedJob = await recruiterRepository.getPool().query(
      'SELECT company_id, recruiter_id FROM jobs WHERE id = ? AND deleted_at IS NULL LIMIT 1',
      [application.jobId]
    ).then(([rows]) => rows[0]);

    if (!linkedJob) {
      throw new AppError('Job not found', 404, [{ field: 'jobId', reason: 'Linked job was not found or has been closed' }]);
    }

    if (user.role === 'recruiter') {
      if (linkedJob.recruiter_id !== recruiter.id) {
        throw new AppError('Forbidden', 403, [{ field: 'id', reason: 'You can only update status for applications to your jobs' }]);
      }
    } else if (user.role === 'company_admin') {
      if (linkedJob.company_id !== recruiter.company_id) {
        throw new AppError('Forbidden', 403, [{ field: 'id', reason: 'You can only update status for applications in your company' }]);
      }
    }
  }

  await applicationRepository.updateStatus(id, payload.status);
  const row = await applicationRepository.findPipelineItemById(id);
  return mapPipelineRow(row);
}

module.exports = {
  createApplication,
  getMyApplications,
  getRecruiterPipeline,
  updateStatus,
};

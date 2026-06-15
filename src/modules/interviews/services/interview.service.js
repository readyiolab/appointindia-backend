const AppError = require('../../../common/errors/AppError');
const { toMySQLDatetime } = require('../../../common/datetime');
const applicationRepository = require('../../applications/repositories/application.repository');
const interviewRepository = require('../repositories/interview.repository');

async function createInterview(payload, user) {
  if (!['recruiter', 'admin'].includes(user.role) && !payload.recruiterId) {
    throw new AppError('Forbidden', 403, [{ field: 'recruiterId', reason: 'A recruiter or admin must schedule interviews' }]);
  }

  const application = await applicationRepository.findById(payload.applicationId);

  if (!application) {
    throw new AppError('Application not found', 404, [{ field: 'applicationId', reason: 'No application found for this id' }]);
  }

  const interviewId = await interviewRepository.createInterview({
    ...payload,
    scheduledAt: toMySQLDatetime(payload.scheduledAt),
    candidateId: payload.candidateId || application.candidate_id,
    recruiterId: payload.recruiterId || user.id,
    createdBy: user.id,
  });

  return { id: interviewId, applicationId: payload.applicationId };
}

async function getMyInterviews(user) {
  return interviewRepository.findByCandidate(user.id);
}

async function updateInterview(user, id, payload) {
  if (!['recruiter', 'admin'].includes(user.role)) {
    throw new AppError('Forbidden', 403, [{ field: 'role', reason: 'Only recruiters and admins can update interviews' }]);
  }

  const updates = { ...payload };

  if (payload.scheduledAt !== undefined) {
    updates.scheduledAt = toMySQLDatetime(payload.scheduledAt);
  }

  await interviewRepository.updateInterview(id, updates);
  return { id, updated: true };
}

module.exports = { createInterview, getMyInterviews, updateInterview };

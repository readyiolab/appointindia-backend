const AppError = require('../../../common/errors/AppError');
const savedJobRepository = require('../repositories/savedJob.repository');

function ensureOwner(user, candidateId) {
  if (user.role !== 'admin' && candidateId !== user.id) {
    throw new AppError('Forbidden', 403, [{ field: 'candidateId', reason: 'You can only manage your own saved jobs' }]);
  }
}

async function saveJob(payload, user) {
  const candidateId = payload.candidateId || user.id;
  ensureOwner(user, candidateId);

  const savedJobId = await savedJobRepository.saveJob({
    ...payload,
    candidateId,
    createdBy: user.id,
  });

  return { id: savedJobId, candidateId, jobId: payload.jobId };
}

async function getMySavedJobs(user) {
  return savedJobRepository.findByCandidate(user.id);
}

async function removeSavedJob(user, id) {
  const savedJobs = await savedJobRepository.findByCandidate(user.id);
  const savedJob = savedJobs.find((item) => item.id === id);

  if (!savedJob) {
    throw new AppError('Saved job not found', 404, [{ field: 'id', reason: 'No saved job found for this id' }]);
  }

  await savedJobRepository.deleteSavedJob(id);
  return { id, deleted: true };
}

module.exports = { saveJob, getMySavedJobs, removeSavedJob };

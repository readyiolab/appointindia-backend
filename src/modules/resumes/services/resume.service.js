const AppError = require('../../../common/errors/AppError');
const resumeRepository = require('../repositories/resume.repository');
const candidateRepository = require('../../candidates/repositories/candidate.repository');

async function ensureOwner(user, candidateId) {
  if (user.role === 'admin') return;

  const candidate = await candidateRepository.findByUserId(user.id);
  if (!candidate || candidate.id !== candidateId) {
    throw new AppError('Forbidden', 403, [{ field: 'candidateId', reason: 'You can only manage your own resumes' }]);
  }
}

async function uploadResume(payload, user) {
  let candidateId = payload.candidateId;
  if (!candidateId) {
    const candidate = await candidateRepository.findByUserId(user.id);
    if (!candidate) {
      throw new AppError('Candidate profile not found', 404, [{ field: 'candidate', reason: 'No candidate profile exists for this user' }]);
    }
    candidateId = candidate.id;
  } else {
    await ensureOwner(user, candidateId);
  }

  const resumeId = await resumeRepository.createResume({
    ...payload,
    candidateId,
    createdBy: user.id,
  });

  return { id: resumeId, candidateId, fileName: payload.fileName };
}

async function getMyResumes(user) {
  const candidate = await candidateRepository.findByUserId(user.id);
  if (!candidate) {
    return [];
  }
  return resumeRepository.findByCandidate(candidate.id);
}

async function deleteResume(user, id) {
  const candidate = await candidateRepository.findByUserId(user.id);
  if (!candidate && user.role !== 'admin') {
    throw new AppError('Forbidden', 403, [{ field: 'candidate', reason: 'No candidate profile exists for this user' }]);
  }

  if (user.role === 'admin') {
    await resumeRepository.deleteResume(id);
    return { id, deleted: true };
  }

  const resumes = await resumeRepository.findByCandidate(candidate.id);
  const resume = resumes.find((item) => item.id === id);

  if (!resume) {
    throw new AppError('Resume not found', 404, [{ field: 'id', reason: 'No resume found for this id' }]);
  }

  await resumeRepository.deleteResume(id);
  return { id, deleted: true };
}

module.exports = { uploadResume, getMyResumes, deleteResume };

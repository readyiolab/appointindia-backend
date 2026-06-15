const AppError = require('../../../common/errors/AppError');
const recruiterRepository = require('../repositories/recruiter.repository');

async function createRecruiter(user, payload) {
  const existing = await recruiterRepository.findByUserId(user.id);

  if (existing) {
    throw new AppError('Recruiter already exists', 409, [{ field: 'userId', reason: 'A recruiter profile already exists for this user' }]);
  }

  const recruiterId = await recruiterRepository.createRecruiter({
    ...payload,
    userId: user.id,
    createdBy: user.id,
  });

  return { id: recruiterId, message: 'Recruiter profile created successfully' };
}

async function getRecruiter(id) {
  const recruiter = await recruiterRepository.findById(id);

  if (!recruiter) {
    throw new AppError('Recruiter not found', 404, [{ field: 'id', reason: 'No recruiter found for this id' }]);
  }

  return recruiter;
}

async function updateRecruiter(user, id, payload) {
  const recruiter = await recruiterRepository.findById(id);

  if (!recruiter) {
    throw new AppError('Recruiter not found', 404, [{ field: 'id', reason: 'No recruiter found for this id' }]);
  }

  return recruiterRepository.updateRecruiter(id, { ...payload, updatedBy: user.id });
}

module.exports = { createRecruiter, getRecruiter, updateRecruiter };

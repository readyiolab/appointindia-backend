const bcrypt = require('bcryptjs');
const AppError = require('../../../common/errors/AppError');
const userRepository = require('../repositories/user.repository');

async function getMe(user) {
  return userRepository.findById(user.id);
}

async function updateMe(user, payload) {
  const userUpdates = {};
  if (payload.email !== undefined) userUpdates.email = payload.email;
  if (payload.phone !== undefined) userUpdates.phone = payload.phone;

  let updatedUser = null;
  if (Object.keys(userUpdates).length > 0) {
    updatedUser = await userRepository.updateUser(user.id, userUpdates);
    if (!updatedUser) {
      throw new AppError('User update failed', 400, [{ field: 'user', reason: 'Unable to update profile credentials' }]);
    }
  } else {
    updatedUser = await userRepository.findById(user.id);
  }

  if (user.role === 'candidate' && (payload.firstName !== undefined || payload.lastName !== undefined)) {
    const candidateRepository = require('../../candidates/repositories/candidate.repository');
    const candidate = await candidateRepository.findByUserId(user.id);
    const candidatePayload = {
      firstName: payload.firstName !== undefined ? payload.firstName : (candidate?.first_name || ''),
      lastName: payload.lastName !== undefined ? payload.lastName : (candidate?.last_name || ''),
      headline: candidate?.headline || '',
      currentLocation: candidate?.current_location || '',
      preferredLocation: candidate?.preferred_location || '',
      totalExperienceYears: candidate?.total_experience_years || 0,
      currentSalary: candidate?.current_salary || 0,
      expectedSalary: candidate?.expected_salary || 0,
      summary: candidate?.summary || '',
    };
    await candidateRepository.upsertCandidate(user.id, candidatePayload);
  } else if (user.role === 'recruiter' && (payload.firstName !== undefined || payload.lastName !== undefined)) {
    const recruiterRepository = require('../../recruiters/repositories/recruiter.repository');
    const recruiter = await recruiterRepository.findByUserId(user.id);
    if (recruiter) {
      const recruiterUpdates = {};
      if (payload.firstName !== undefined) recruiterUpdates.firstName = payload.firstName;
      if (payload.lastName !== undefined) recruiterUpdates.lastName = payload.lastName;
      await recruiterRepository.updateRecruiter(recruiter.id, { ...recruiterUpdates, updatedBy: user.id });
    }
  }

  return userRepository.findById(user.id);
}

async function changePassword(user, payload) {
  const currentUser = await userRepository.findById(user.id);

  if (!currentUser) {
    throw new AppError('User not found', 404, [{ field: 'user', reason: 'No user found for this id' }]);
  }

  const isValid = await bcrypt.compare(payload.currentPassword, currentUser.password_hash);

  if (!isValid) {
    throw new AppError('Invalid current password', 400, [{ field: 'currentPassword', reason: 'Current password does not match' }]);
  }

  const newHash = await bcrypt.hash(payload.newPassword, 10);
  await userRepository.updatePassword(user.id, newHash);

  return { message: 'Password updated successfully' };
}

module.exports = { getMe, updateMe, changePassword };

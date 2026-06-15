const AppError = require('../../../common/errors/AppError');
const candidateRepository = require('../repositories/candidate.repository');

function mapCandidate(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    userId: row.user_id,
    firstName: row.first_name,
    lastName: row.last_name,
    headline: row.headline,
    currentLocation: row.current_location,
    preferredLocation: row.preferred_location,
    totalExperienceYears: row.total_experience_years,
    currentSalary: row.current_salary,
    expectedSalary: row.expected_salary,
    summary: row.summary,
    profileCompletionPct: row.profile_completion_pct,
  };
}

async function getMe(user) {
  let candidate = await candidateRepository.findByUserId(user.id);

  if (!candidate) {
    const emailPrefix = user.email?.split('@')[0] || 'Candidate';
    candidate = await candidateRepository.upsertCandidate(user.id, {
      firstName: emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1),
      lastName: '',
      headline: '',
      currentLocation: '',
      preferredLocation: '',
      totalExperienceYears: 0,
      currentSalary: 0,
      expectedSalary: 0,
      summary: '',
    });
  }

  return mapCandidate(candidate);
}

async function upsertMe(user, payload) {
  const candidate = await candidateRepository.upsertCandidate(user.id, payload);
  return mapCandidate(candidate);
}

module.exports = { getMe, upsertMe };

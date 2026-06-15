const { successResponse } = require('../../../common/response');
const candidateService = require('../services/candidate.service');

async function getMe(req, res, next) {
  try {
    const result = await candidateService.getMe(req.user);
    return successResponse(res, 'Candidate profile fetched successfully', result, 200);
  } catch (error) {
    next(error);
  }
}

async function upsertMe(req, res, next) {
  try {
    const result = await candidateService.upsertMe(req.user, req.body);
    return successResponse(res, 'Candidate profile saved successfully', result, 200);
  } catch (error) {
    next(error);
  }
}

module.exports = { getMe, upsertMe };

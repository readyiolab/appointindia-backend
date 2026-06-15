const { successResponse } = require('../../../common/response');
const savedJobService = require('../services/savedJob.service');

async function save(req, res, next) {
  try {
    const result = await savedJobService.saveJob(req.body, req.user);
    return successResponse(res, 'Job saved successfully', result, 201);
  } catch (error) {
    next(error);
  }
}

async function getMySavedJobs(req, res, next) {
  try {
    const result = await savedJobService.getMySavedJobs(req.user);
    return successResponse(res, 'Saved jobs fetched successfully', result, 200);
  } catch (error) {
    next(error);
  }
}

async function remove(req, res, next) {
  try {
    const result = await savedJobService.removeSavedJob(req.user, req.params.id);
    return successResponse(res, 'Saved job removed successfully', result, 200);
  } catch (error) {
    next(error);
  }
}

module.exports = { save, getMySavedJobs, remove };

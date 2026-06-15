const { successResponse } = require('../../../common/response');
const applicationService = require('../services/application.service');

async function create(req, res, next) {
  try {
    const result = await applicationService.createApplication(req.body, req.user);
    return successResponse(res, 'Application submitted successfully', result, 201);
  } catch (error) {
    next(error);
  }
}

async function getMyApplications(req, res, next) {
  try {
    const result = await applicationService.getMyApplications(req.user);
    return successResponse(res, 'Applications fetched successfully', result, 200);
  } catch (error) {
    next(error);
  }
}

async function getRecruiterPipeline(req, res, next) {
  try {
    const result = await applicationService.getRecruiterPipeline(req.user, req.query);
    return successResponse(res, 'Recruiter pipeline fetched successfully', result, 200);
  } catch (error) {
    next(error);
  }
}

async function updateStatus(req, res, next) {
  try {
    const result = await applicationService.updateStatus(req.user, req.params.id, req.body);
    return successResponse(res, 'Application status updated successfully', result, 200);
  } catch (error) {
    next(error);
  }
}

module.exports = { create, getMyApplications, getRecruiterPipeline, updateStatus };

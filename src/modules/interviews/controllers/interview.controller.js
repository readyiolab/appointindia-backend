const { successResponse } = require('../../../common/response');
const interviewService = require('../services/interview.service');

async function create(req, res, next) {
  try {
    const result = await interviewService.createInterview(req.body, req.user);
    return successResponse(res, 'Interview scheduled successfully', result, 201);
  } catch (error) {
    next(error);
  }
}

async function getMyInterviews(req, res, next) {
  try {
    const result = await interviewService.getMyInterviews(req.user);
    return successResponse(res, 'Interviews fetched successfully', result, 200);
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const result = await interviewService.updateInterview(req.user, req.params.id, req.body);
    return successResponse(res, 'Interview updated successfully', result, 200);
  } catch (error) {
    next(error);
  }
}

module.exports = { create, getMyInterviews, update };

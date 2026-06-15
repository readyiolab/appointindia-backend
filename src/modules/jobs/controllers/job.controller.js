const { successResponse } = require('../../../common/response');
const jobService = require('../services/job.service');

async function create(req, res, next) {
  try {
    const result = await jobService.createJob(req.body, req.user);
    return successResponse(res, 'Job created successfully', result, 201);
  } catch (error) {
    next(error);
  }
}

async function getById(req, res, next) {
  try {
    const result = await jobService.getById(req.params.id);
    return successResponse(res, 'Job fetched successfully', result, 200);
  } catch (error) {
    next(error);
  }
}

async function search(req, res, next) {
  try {
    const result = await jobService.search(req.query);
    return successResponse(res, 'Job search completed', result, 200);
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const result = await jobService.updateJob(req.user, req.params.id, req.body);
    return successResponse(res, 'Job updated successfully', result, 200);
  } catch (error) {
    next(error);
  }
}

module.exports = { create, getById, search, update };

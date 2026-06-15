const { successResponse } = require('../../../common/response');
const recruiterService = require('../services/recruiter.service');

async function create(req, res, next) {
  try {
    const result = await recruiterService.createRecruiter(req.user, req.body);
    return successResponse(res, 'Recruiter created successfully', result, 201);
  } catch (error) {
    next(error);
  }
}

async function getById(req, res, next) {
  try {
    const result = await recruiterService.getRecruiter(req.params.id);
    return successResponse(res, 'Recruiter fetched successfully', result, 200);
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const result = await recruiterService.updateRecruiter(req.user, req.params.id, req.body);
    return successResponse(res, 'Recruiter updated successfully', result, 200);
  } catch (error) {
    next(error);
  }
}

module.exports = { create, getById, update };

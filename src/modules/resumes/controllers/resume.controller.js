const { successResponse } = require('../../../common/response');
const resumeService = require('../services/resume.service');

async function upload(req, res, next) {
  try {
    const result = await resumeService.uploadResume(req.body, req.user);
    return successResponse(res, 'Resume uploaded successfully', result, 201);
  } catch (error) {
    next(error);
  }
}

async function getMyResumes(req, res, next) {
  try {
    const result = await resumeService.getMyResumes(req.user);
    return successResponse(res, 'Resumes fetched successfully', result, 200);
  } catch (error) {
    next(error);
  }
}

async function remove(req, res, next) {
  try {
    const result = await resumeService.deleteResume(req.user, req.params.id);
    return successResponse(res, 'Resume deleted successfully', result, 200);
  } catch (error) {
    next(error);
  }
}

module.exports = { upload, getMyResumes, remove };

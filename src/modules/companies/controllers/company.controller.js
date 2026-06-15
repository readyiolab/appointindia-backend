const { successResponse } = require('../../../common/response');
const companyService = require('../services/company.service');

async function create(req, res, next) {
  try {
    const result = await companyService.createCompany(req.user, req.body);
    return successResponse(res, 'Company created successfully', result, 201);
  } catch (error) {
    next(error);
  }
}

async function getById(req, res, next) {
  try {
    const result = await companyService.getCompany(req.params.id);
    return successResponse(res, 'Company fetched successfully', result, 200);
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const result = await companyService.updateCompany(req.user, req.params.id, req.body);
    return successResponse(res, 'Company updated successfully', result, 200);
  } catch (error) {
    next(error);
  }
}

module.exports = { create, getById, update };

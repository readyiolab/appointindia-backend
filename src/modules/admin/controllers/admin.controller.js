const { successResponse } = require('../../../common/response');
const adminService = require('../services/admin.service');

async function listUsers(req, res, next) {
  try {
    const result = await adminService.listUsers(req.query);
    return successResponse(res, 'Users fetched successfully', result, 200);
  } catch (error) {
    next(error);
  }
}

async function updateUserStatus(req, res, next) {
  try {
    const result = await adminService.updateUserStatus(req.params.id, req.body.status);
    return successResponse(res, 'User status updated successfully', result, 200);
  } catch (error) {
    next(error);
  }
}

module.exports = { listUsers, updateUserStatus };

const { successResponse } = require('../../../common/response');
const userService = require('../services/user.service');

async function getMe(req, res, next) {
  try {
    const result = await userService.getMe(req.user);
    return successResponse(res, 'User profile fetched successfully', result, 200);
  } catch (error) {
    next(error);
  }
}

async function updateMe(req, res, next) {
  try {
    const result = await userService.updateMe(req.user, req.body);
    return successResponse(res, 'User profile updated successfully', result, 200);
  } catch (error) {
    next(error);
  }
}

async function changePassword(req, res, next) {
  try {
    const result = await userService.changePassword(req.user, req.body);
    return successResponse(res, 'Password updated successfully', result, 200);
  } catch (error) {
    next(error);
  }
}

module.exports = { getMe, updateMe, changePassword };

const { successResponse } = require('../../../common/response');
const authService = require('../services/auth.service');

async function register(req, res, next) {
  try {
    const result = await authService.register(req.body);
    return successResponse(res, 'User registered successfully', result, 201);
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const result = await authService.login(req.body);
    return successResponse(res, 'Login successful', result, 200);
  } catch (error) {
    next(error);
  }
}

async function refresh(req, res, next) {
  try {
    const refreshToken = req.body?.refreshToken;
    const result = await authService.refresh(refreshToken);
    return successResponse(res, 'Token refreshed successfully', result, 200);
  } catch (error) {
    next(error);
  }
}

async function logout(req, res, next) {
  try {
    const refreshToken = req.body?.refreshToken;
    const result = await authService.logout(refreshToken);
    return successResponse(res, 'Logged out successfully', result, 200);
  } catch (error) {
    next(error);
  }
}

module.exports = { register, login, refresh, logout };

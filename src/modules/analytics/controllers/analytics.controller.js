const { successResponse } = require('../../../common/response');
const analyticsService = require('../services/analytics.service');

async function getSummary(req, res, next) {
  try {
    const result = await analyticsService.getSummary(req.query);
    return successResponse(res, 'Analytics summary fetched successfully', result, 200);
  } catch (error) {
    next(error);
  }
}

module.exports = { getSummary };

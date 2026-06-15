const { successResponse } = require('../../../common/response');
const subscriptionService = require('../services/subscription.service');

async function listPlans(req, res, next) {
  try {
    const result = await subscriptionService.listPlans(req.query);
    return successResponse(res, 'Plans fetched successfully', result, 200);
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const result = await subscriptionService.createSubscription(req.body, req.user);
    return successResponse(res, 'Subscription created successfully', result, 201);
  } catch (error) {
    next(error);
  }
}

module.exports = { listPlans, create };

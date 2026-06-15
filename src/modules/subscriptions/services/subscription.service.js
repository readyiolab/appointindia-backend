const AppError = require('../../../common/errors/AppError');
const subscriptionRepository = require('../repositories/subscription.repository');

async function listPlans() {
  return subscriptionRepository.listPlans();
}

async function createSubscription(payload, user) {
  if (!['recruiter', 'admin'].includes(user.role)) {
    throw new AppError('Forbidden', 403, [{ field: 'role', reason: 'Only recruiters and admins can create subscriptions' }]);
  }

  const recruiterId = payload.recruiterId || user.id;
  const subscriptionId = await subscriptionRepository.createSubscription({
    recruiterId,
    planId: payload.planId,
    createdBy: user.id,
  });

  return { id: subscriptionId, recruiterId, planId: payload.planId };
}

module.exports = { listPlans, createSubscription };

const express = require('express');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/authorize');
const { validate } = require('../../middleware/validate');
const { createSubscriptionSchema } = require('../../modules/subscriptions/validators/subscription.validator');
const subscriptionController = require('../../modules/subscriptions/controllers/subscription.controller');

const router = express.Router();

router.use(authenticate);

router.get('/plans', authorize('recruiter', 'admin'), subscriptionController.listPlans);
router.post('/', authorize('recruiter', 'admin'), validate(createSubscriptionSchema), subscriptionController.create);

module.exports = router;

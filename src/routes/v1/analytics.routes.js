const express = require('express');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/authorize');
const analyticsController = require('../../modules/analytics/controllers/analytics.controller');

const router = express.Router();

router.use(authenticate, authorize('admin'));
router.get('/summary', analyticsController.getSummary);

module.exports = router;

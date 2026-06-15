const express = require('express');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/authorize');
const { validate } = require('../../middleware/validate');
const { markReadSchema } = require('../../modules/notifications/validators/notification.validator');
const notificationController = require('../../modules/notifications/controllers/notification.controller');

const router = express.Router();

router.use(authenticate);

router.get('/me', authorize('candidate', 'recruiter', 'company_admin', 'admin'), notificationController.getMyNotifications);
router.post('/', authorize('candidate', 'recruiter', 'company_admin', 'admin'), notificationController.create);
router.patch('/:id/read', authorize('candidate', 'recruiter', 'company_admin', 'admin'), validate(markReadSchema), notificationController.markAsRead);

module.exports = router;

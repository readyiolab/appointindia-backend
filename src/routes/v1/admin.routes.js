const express = require('express');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/authorize');
const { validate } = require('../../middleware/validate');
const { updateUserStatusSchema } = require('../../modules/admin/validators/admin.validator');
const adminController = require('../../modules/admin/controllers/admin.controller');

const router = express.Router();

router.use(authenticate, authorize('admin'));

router.get('/users', adminController.listUsers);
router.patch('/users/:id/status', validate(updateUserStatusSchema), adminController.updateUserStatus);

module.exports = router;

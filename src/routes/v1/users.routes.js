const express = require('express');
const { authenticate } = require('../../middleware/auth');
const { validate } = require('../../middleware/validate');
const { updateUserSchema, changePasswordSchema } = require('../../modules/users/validators/user.validator');
const userController = require('../../modules/users/controllers/user.controller');

const router = express.Router();

router.use(authenticate);

router.get('/me', userController.getMe);
router.put('/me', validate(updateUserSchema), userController.updateMe);
router.patch('/change-password', validate(changePasswordSchema), userController.changePassword);

module.exports = router;

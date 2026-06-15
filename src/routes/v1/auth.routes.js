const express = require('express');
const { validate } = require('../../middleware/validate');
const { authLoginSchema, authRegisterSchema } = require('../../modules/auth/validators/auth.validator');
const authController = require('../../modules/auth/controllers/auth.controller');

const router = express.Router();

router.post('/register', validate(authRegisterSchema), authController.register);
router.post('/login', validate(authLoginSchema), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

module.exports = router;

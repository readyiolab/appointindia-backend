const express = require('express');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/authorize');
const { validate } = require('../../middleware/validate');
const { createRecruiterSchema, updateRecruiterSchema } = require('../../modules/recruiters/validators/recruiter.validator');
const recruiterController = require('../../modules/recruiters/controllers/recruiter.controller');

const router = express.Router();

router.use(authenticate);

router.post('/', authorize('company_admin', 'admin'), validate(createRecruiterSchema), recruiterController.create);
router.get('/:id', authorize('company_admin', 'admin', 'recruiter'), recruiterController.getById);
router.patch('/:id', authorize('company_admin', 'admin', 'recruiter'), validate(updateRecruiterSchema), recruiterController.update);

module.exports = router;

const express = require('express');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/authorize');
const { validate } = require('../../middleware/validate');
const { createJobSchema, updateJobSchema, searchJobSchema } = require('../../modules/jobs/validators/job.validator');
const jobsController = require('../../modules/jobs/controllers/job.controller');

const router = express.Router();

router.get('/search', validate(searchJobSchema, 'query'), jobsController.search);
router.get('/:id', jobsController.getById);
router.post('/', authenticate, authorize('recruiter', 'company_admin', 'admin'), validate(createJobSchema), jobsController.create);
router.patch('/:id', authenticate, authorize('recruiter', 'company_admin', 'admin'), validate(updateJobSchema), jobsController.update);

module.exports = router;

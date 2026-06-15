const express = require('express');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/authorize');
const { validate } = require('../../middleware/validate');
const {
  createApplicationSchema,
  updateApplicationStatusSchema,
  recruiterPipelineQuerySchema,
} = require('../../modules/applications/validators/application.validator');
const applicationController = require('../../modules/applications/controllers/application.controller');

const router = express.Router();

router.use(authenticate);

router.get('/me', authorize('candidate', 'admin'), applicationController.getMyApplications);
router.get(
  '/recruiter/pipeline',
  authorize('recruiter', 'company_admin', 'admin'),
  validate(recruiterPipelineQuerySchema, 'query'),
  applicationController.getRecruiterPipeline
);
router.post('/', authorize('candidate', 'admin'), validate(createApplicationSchema), applicationController.create);
router.patch(
  '/:id/status',
  authorize('recruiter', 'company_admin', 'admin'),
  validate(updateApplicationStatusSchema),
  applicationController.updateStatus
);

module.exports = router;

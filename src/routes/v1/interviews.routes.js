const express = require('express');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/authorize');
const { validate } = require('../../middleware/validate');
const { scheduleInterviewSchema, updateInterviewSchema } = require('../../modules/interviews/validators/interview.validator');
const interviewController = require('../../modules/interviews/controllers/interview.controller');

const router = express.Router();

router.use(authenticate);

router.get('/me', authorize('candidate', 'admin'), interviewController.getMyInterviews);
router.post('/', authorize('recruiter', 'admin'), validate(scheduleInterviewSchema), interviewController.create);
router.patch('/:id', authorize('recruiter', 'admin'), validate(updateInterviewSchema), interviewController.update);

module.exports = router;

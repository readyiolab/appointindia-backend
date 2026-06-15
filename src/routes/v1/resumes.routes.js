const express = require('express');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/authorize');
const { validate } = require('../../middleware/validate');
const { uploadResumeSchema } = require('../../modules/resumes/validators/resume.validator');
const resumeController = require('../../modules/resumes/controllers/resume.controller');

const router = express.Router();

router.use(authenticate);

router.get('/me', authorize('candidate', 'admin'), resumeController.getMyResumes);
router.post('/', authorize('candidate', 'admin'), validate(uploadResumeSchema), resumeController.upload);
router.delete('/:id', authorize('candidate', 'admin'), resumeController.remove);

module.exports = router;

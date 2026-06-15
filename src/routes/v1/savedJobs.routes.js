const express = require('express');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/authorize');
const { validate } = require('../../middleware/validate');
const { saveJobSchema } = require('../../modules/savedJobs/validators/savedJob.validator');
const savedJobController = require('../../modules/savedJobs/controllers/savedJob.controller');

const router = express.Router();

router.use(authenticate);

router.get('/me', authorize('candidate', 'admin'), savedJobController.getMySavedJobs);
router.post('/', authorize('candidate', 'admin'), validate(saveJobSchema), savedJobController.save);
router.delete('/:id', authorize('candidate', 'admin'), savedJobController.remove);

module.exports = router;

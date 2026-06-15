const express = require('express');
const { authenticate } = require('../../middleware/auth');
const { validate } = require('../../middleware/validate');
const { updateCandidateSchema } = require('../../modules/candidates/validators/candidate.validator');
const candidateController = require('../../modules/candidates/controllers/candidate.controller');

const router = express.Router();

router.use(authenticate);

router.get('/me', candidateController.getMe);
router.put('/me', validate(updateCandidateSchema), candidateController.upsertMe);

module.exports = router;

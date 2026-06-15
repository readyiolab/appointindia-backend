const express = require('express');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/authorize');
const { validate } = require('../../middleware/validate');
const { createCompanySchema, updateCompanySchema } = require('../../modules/companies/validators/company.validator');
const companyController = require('../../modules/companies/controllers/company.controller');

const router = express.Router();

router.use(authenticate);

router.post('/', authorize('company_admin', 'admin'), validate(createCompanySchema), companyController.create);
router.get('/:id', authorize('company_admin', 'admin', 'recruiter'), companyController.getById);
router.patch('/:id', authorize('company_admin', 'admin'), validate(updateCompanySchema), companyController.update);

module.exports = router;

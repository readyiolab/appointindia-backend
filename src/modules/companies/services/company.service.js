const AppError = require('../../../common/errors/AppError');
const companyRepository = require('../repositories/company.repository');

async function createCompany(user, payload) {
  const companyId = await companyRepository.createCompany({
    ...payload,
    createdBy: user.id,
  });

  return { id: companyId, message: 'Company created successfully' };
}

async function getCompany(id) {
  const company = await companyRepository.findById(id);

  if (!company) {
    throw new AppError('Company not found', 404, [{ field: 'id', reason: 'No company found for this id' }]);
  }

  return company;
}

async function updateCompany(user, id, payload) {
  const company = await companyRepository.findById(id);

  if (!company) {
    throw new AppError('Company not found', 404, [{ field: 'id', reason: 'No company found for this id' }]);
  }

  return companyRepository.updateCompany(id, { ...payload, updatedBy: user.id });
}

module.exports = { createCompany, getCompany, updateCompany };

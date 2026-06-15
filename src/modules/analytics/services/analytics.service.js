const analyticsRepository = require('../repositories/analytics.repository');

async function getSummary() {
  return analyticsRepository.getSummary();
}

module.exports = { getSummary };

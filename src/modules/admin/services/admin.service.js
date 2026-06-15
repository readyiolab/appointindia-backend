const AppError = require('../../../common/errors/AppError');
const adminRepository = require('../repositories/admin.repository');

function mapUser(row) {
  if (!row) {
    return null;
  }

  const createdAt = row.created_at ? new Date(row.created_at) : null;

  return {
    id: row.id,
    email: row.email,
    phone: row.phone || null,
    role: row.role,
    status: row.status,
    emailVerified: Boolean(row.email_verified),
    createdAt: createdAt && !Number.isNaN(createdAt.getTime()) ? createdAt.toISOString() : null,
  };
}

async function listUsers() {
  const rows = await adminRepository.listUsers();
  return rows.map(mapUser);
}

async function updateUserStatus(id, status) {
  if (!status) {
    throw new AppError('Validation failed', 400, [{ field: 'status', reason: 'Status is required' }]);
  }

  await adminRepository.updateStatus(id, status);
  return { id, status };
}

module.exports = { listUsers, updateUserStatus };

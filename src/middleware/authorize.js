const AppError = require('../common/errors/AppError');

function authorize(...allowedRoles) {
  return (req, res, next) => {
    const role = req.user?.role;

    if (!role || !allowedRoles.includes(role)) {
      return next(new AppError('Forbidden', 403, [{ field: 'role', reason: 'You do not have access to this resource' }]));
    }

    next();
  };
}

module.exports = { authorize };

function successResponse(res, message, data = null, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
}

function errorResponse(res, message, errors = [], statusCode = 400) {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
}

module.exports = { successResponse, errorResponse };

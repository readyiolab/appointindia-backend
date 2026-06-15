const { successResponse } = require('../../../common/response');
const notificationService = require('../services/notification.service');

async function create(req, res, next) {
  try {
    const result = await notificationService.createNotification(req.body, req.user);
    return successResponse(res, 'Notification created successfully', result, 201);
  } catch (error) {
    next(error);
  }
}

async function getMyNotifications(req, res, next) {
  try {
    const result = await notificationService.getMyNotifications(req.user);
    return successResponse(res, 'Notifications fetched successfully', result, 200);
  } catch (error) {
    next(error);
  }
}

async function markAsRead(req, res, next) {
  try {
    const result = await notificationService.markAsRead(req.user, req.params.id);
    return successResponse(res, 'Notification marked as read', result, 200);
  } catch (error) {
    next(error);
  }
}

module.exports = { create, getMyNotifications, markAsRead };

const AppError = require('../../../common/errors/AppError');
const notificationRepository = require('../repositories/notification.repository');

async function createNotification(payload, user) {
  if (!payload.title || !payload.message) {
    throw new AppError('Validation failed', 400, [{ field: 'title/message', reason: 'Title and message are required' }]);
  }

  const userId = payload.userId || user.id;
  const notificationId = await notificationRepository.createNotification({
    userId,
    title: payload.title,
    message: payload.message,
    createdBy: user.id,
  });

  return { id: notificationId, userId, title: payload.title };
}

async function getMyNotifications(user) {
  return notificationRepository.findByUser(user.id);
}

async function markAsRead(user, id) {
  const notifications = await notificationRepository.findByUser(user.id);
  const notification = notifications.find((item) => item.id === id);

  if (!notification) {
    throw new AppError('Notification not found', 404, [{ field: 'id', reason: 'No notification found for this id' }]);
  }

  await notificationRepository.markRead(id);
  return { id, isRead: true };
}

module.exports = { createNotification, getMyNotifications, markAsRead };

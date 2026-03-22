const { sendSuccess, sendError } = require('../../../utils/responseHandler');
const notificationsService = require('./notifications.service');

exports.getNotifications = async (req, res) => {
  try {
    const data = await notificationsService.getNotifications({
      companyId: req.companyId,
      user: req.user,
      query: req.query,
    });

    res.set('Cache-Control', 'private, max-age=15, stale-while-revalidate=30');
    return sendSuccess(res, 200, 'Notifications fetched successfully', data);
  } catch (error) {
    return sendError(
      res,
      error.statusCode || 500,
      error.message || 'Failed to fetch notifications',
      error.details || error.message
    );
  }
};

exports.markNotificationRead = async (req, res) => {
  try {
    const data = await notificationsService.markNotificationRead({
      notificationId: req.params.id,
      companyId: req.companyId,
      user: req.user,
    });

    return sendSuccess(res, 200, 'Notification marked as read', data);
  } catch (error) {
    return sendError(
      res,
      error.statusCode || 400,
      error.message || 'Failed to mark notification as read',
      error.details || error.message
    );
  }
};

exports.markAllNotificationsRead = async (req, res) => {
  try {
    const data = await notificationsService.markAllNotificationsRead({
      companyId: req.companyId,
      user: req.user,
    });

    return sendSuccess(res, 200, 'Notifications marked as read', data);
  } catch (error) {
    return sendError(
      res,
      error.statusCode || 400,
      error.message || 'Failed to mark notifications as read',
      error.details || error.message
    );
  }
};

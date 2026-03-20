const Notification = require('../models/Notification');
const { sendSuccess, sendError } = require('../utils/responseHandler');

const buildNotificationVisibilityClause = (user) => {
  const branchId = user?.branchId?._id || user?.branchId || null;
  const visibility = [{ user: user?._id }, { user: null, branchId: null }];

  if (branchId) {
    visibility.push({ user: null, branchId });
  }

  if (user?.effectiveAccess?.isHeadOffice) {
    visibility.push({ user: null });
  }

  return { $or: visibility };
};

exports.getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, type, unreadOnly, read } = req.query;
    const query = {
      companyId: req.companyId,
      ...buildNotificationVisibilityClause(req.user),
    };

    if (type) {
      query.type = type;
    }

    if (String(unreadOnly) === 'true') {
      query.read = false;
    } else if (typeof read !== 'undefined') {
      query.read = String(read) === 'true';
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [notifications, total, unreadCount, byType] = await Promise.all([
      Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      Notification.countDocuments(query),
      Notification.countDocuments({ ...query, read: false }),
      Notification.aggregate([
        { $match: query },
        { $group: { _id: '$type', count: { $sum: 1 }, unread: { $sum: { $cond: [{ $eq: ['$read', false] }, 1, 0] } } } },
        { $sort: { _id: 1 } },
      ]),
    ]);

    return sendSuccess(res, 200, 'Notifications fetched successfully', {
      notifications,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)) || 1,
      },
      unreadCount,
      byType,
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch notifications', error.message);
  }
};

exports.markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        companyId: req.companyId,
        ...buildNotificationVisibilityClause(req.user),
      },
      { $set: { read: true } },
      { new: true }
    ).lean();

    if (!notification) {
      return sendError(res, 404, 'Notification not found');
    }

    return sendSuccess(res, 200, 'Notification marked as read', { notification });
  } catch (error) {
    return sendError(res, 400, 'Failed to mark notification as read', error.message);
  }
};

exports.markAllNotificationsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      {
        companyId: req.companyId,
        read: false,
        ...buildNotificationVisibilityClause(req.user),
      },
      { $set: { read: true } }
    );

    return sendSuccess(res, 200, 'Notifications marked as read', {
      modifiedCount: result.modifiedCount || 0,
    });
  } catch (error) {
    return sendError(res, 400, 'Failed to mark notifications as read', error.message);
  }
};

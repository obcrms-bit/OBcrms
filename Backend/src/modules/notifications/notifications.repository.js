const Notification = require('../../../models/Notification');

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

async function fetchNotificationsPage(query, { page, limit }) {
  const skip = (page - 1) * limit;

  const [notifications, total, unreadCount, byType] = await Promise.all([
    Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Notification.countDocuments(query),
    Notification.countDocuments({ ...query, read: false }),
    Notification.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          unread: {
            $sum: {
              $cond: [{ $eq: ['$read', false] }, 1, 0],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  return {
    notifications,
    total,
    unreadCount,
    byType,
  };
}

async function countUnread(query) {
  return Notification.countDocuments({ ...query, read: false });
}

async function markNotificationRead({ notificationId, companyId, user }) {
  return Notification.findOneAndUpdate(
    {
      _id: notificationId,
      companyId,
      ...buildNotificationVisibilityClause(user),
    },
    { $set: { read: true } },
    { new: true }
  ).lean();
}

async function markAllNotificationsRead({ companyId, user }) {
  return Notification.updateMany(
    {
      companyId,
      read: false,
      ...buildNotificationVisibilityClause(user),
    },
    { $set: { read: true } }
  );
}

module.exports = {
  buildNotificationVisibilityClause,
  fetchNotificationsPage,
  countUnread,
  markNotificationRead,
  markAllNotificationsRead,
};

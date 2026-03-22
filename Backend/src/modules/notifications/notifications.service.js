const { createHttpError } = require('../../shared/http/createHttpError');
const notificationsRepository = require('./notifications.repository');

const toPositiveInt = (value, fallback, { min = 1, max = Number.MAX_SAFE_INTEGER } = {}) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, parsed));
};

async function getNotifications({ companyId, user, query }) {
  if (!companyId) {
    throw createHttpError(401, 'Tenant context missing');
  }

  const page = toPositiveInt(query.page, 1);
  const limit = toPositiveInt(query.limit, 20, { min: 1, max: 100 });
  const filters = {
    companyId,
    ...notificationsRepository.buildNotificationVisibilityClause(user),
  };

  if (query.type) {
    filters.type = query.type;
  }

  if (String(query.unreadOnly) === 'true') {
    filters.read = false;
  } else if (typeof query.read !== 'undefined') {
    filters.read = String(query.read) === 'true';
  }

  if (String(query.summaryOnly) === 'true') {
    const unreadCount = await notificationsRepository.countUnread(filters);
    return {
      notifications: [],
      pagination: {
        total: unreadCount,
        page: 1,
        limit: 0,
        pages: 1,
      },
      unreadCount,
      byType: [],
    };
  }

  const result = await notificationsRepository.fetchNotificationsPage(filters, { page, limit });

  return {
    notifications: result.notifications,
    pagination: {
      total: result.total,
      page,
      limit,
      pages: Math.ceil(result.total / limit) || 1,
    },
    unreadCount: result.unreadCount,
    byType: result.byType,
  };
}

async function markNotificationRead({ notificationId, companyId, user }) {
  if (!companyId) {
    throw createHttpError(401, 'Tenant context missing');
  }

  const notification = await notificationsRepository.markNotificationRead({
    notificationId,
    companyId,
    user,
  });

  if (!notification) {
    throw createHttpError(404, 'Notification not found');
  }

  return {
    notification,
  };
}

async function markAllNotificationsRead({ companyId, user }) {
  if (!companyId) {
    throw createHttpError(401, 'Tenant context missing');
  }

  const result = await notificationsRepository.markAllNotificationsRead({
    companyId,
    user,
  });

  return {
    modifiedCount: result.modifiedCount || 0,
  };
}

module.exports = {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
};

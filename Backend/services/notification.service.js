const Notification = require('../models/Notification');

const createNotification = async ({
  companyId,
  branchId = null,
  userId = null,
  type = 'system',
  title,
  message,
  entityType = '',
  entityId = null,
  link = '',
  metadata = {},
}) => {
  if (!companyId || !title || !message) {
    return null;
  }

  try {
    return await Notification.create({
      companyId,
      branchId,
      user: userId,
      type,
      title,
      message,
      entityType,
      entityId,
      link,
      metadata,
    });
  } catch (error) {
    console.error('Notification create failed:', error.message);
    return null;
  }
};

module.exports = {
  createNotification,
};

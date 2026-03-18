const Activity = require('../models/Activity');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const mongoose = require('mongoose');

// GET /activities?entityType=lead&entityId=xxx&page=1&limit=20
exports.getActivities = async (req, res) => {
  try {
    const { entityType, entityId, page = 1, limit = 20 } = req.query;
    const companyId = req.companyId;
    const filter = { companyId };
    if (entityType) filter.entityType = entityType;
    if (entityId && mongoose.Types.ObjectId.isValid(entityId)) filter.entityId = entityId;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [activities, total] = await Promise.all([
      Activity.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      Activity.countDocuments(filter),
    ]);

    return sendSuccess(res, 200, 'Activities fetched', {
      activities,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch activities', error.message);
  }
};

// POST /activities (for manual log, not recommended for most use cases)
exports.createActivity = async (req, res) => {
  try {
    const { entityType, entityId, action, description, performedBy, metadata } = req.body;
    const companyId = req.companyId;
    if (!entityType || !entityId || !action) {
      return sendError(res, 400, 'entityType, entityId, and action are required');
    }
    const activity = await Activity.create({
      companyId,
      entityType,
      entityId,
      action,
      description,
      performedBy,
      metadata,
    });
    return sendSuccess(res, 201, 'Activity logged', activity);
  } catch (error) {
    return sendError(res, 400, 'Failed to log activity', error.message);
  }
};

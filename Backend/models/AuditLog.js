const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    // Multi-Tenancy
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    // User Info
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    userName: String,

    userEmail: String,

    userRole: String,

    // Action Details
    action: {
      type: String,
      enum: ["create", "update", "delete", "export", "login", "logout"],
      required: true,
      index: true,
    },

    resource: {
      type: String,
      enum: ["student", "user", "lead", "application", "report", "company", "settings"],
      required: true,
      index: true,
    },

    resourceId: mongoose.Schema.Types.ObjectId,

    resourceName: String, // e.g., "John Doe", "Email Report"

    // Changes
    changes: {
      before: mongoose.Schema.Types.Mixed,
      after: mongoose.Schema.Types.Mixed,
    },

    // Request/Security Info
    ipAddress: String,

    userAgent: String,

    status: {
      type: String,
      enum: ["success", "failure"],
      default: "success",
    },

    errorMessage: String, // If status is failure

    // Metadata
    metadata: mongoose.Schema.Types.Mixed,

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: "audit_logs",
  }
);

// TTL Index: Auto-delete audit logs after 90 days
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

// Performance indexes
auditLogSchema.index({ companyId: 1, createdAt: -1 });
auditLogSchema.index({ companyId: 1, userId: 1, createdAt: -1 });
auditLogSchema.index({ companyId: 1, action: 1 });
auditLogSchema.index({ companyId: 1, resource: 1 });

// Static method to log an action
auditLogSchema.statics.logAction = async function (
  {
    companyId,
    userId,
    userName,
    userEmail,
    userRole,
    action,
    resource,
    resourceId,
    resourceName,
    changes,
    ipAddress,
    userAgent,
    status = "success",
    errorMessage,
  },
  metadata = {}
) {
  try {
    const auditLog = new this({
      companyId,
      userId,
      userName,
      userEmail,
      userRole,
      action,
      resource,
      resourceId,
      resourceName,
      changes,
      ipAddress,
      userAgent,
      status,
      errorMessage,
      metadata,
    });

    return await auditLog.save();
  } catch (error) {
    console.error("Error logging audit trail:", error);
    // Don't throw - audit logs should never break the application
  }
};

// Instance method to get formatted log
auditLogSchema.methods.toJSON = function () {
  const log = this.toObject();
  log.id = log._id;
  delete log._id;
  return log;
};

module.exports = mongoose.model("AuditLog", auditLogSchema);

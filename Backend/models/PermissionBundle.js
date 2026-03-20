const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema(
  {
    module: { type: String, required: true, trim: true, lowercase: true },
    actions: [{ type: String, trim: true, lowercase: true }],
    scopes: [{ type: String, trim: true, lowercase: true }],
  },
  { _id: false }
);

const permissionBundleSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    key: { type: String, required: true, trim: true, lowercase: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    permissions: { type: [permissionSchema], default: [] },
    fieldAccess: { type: mongoose.Schema.Types.Mixed, default: {} },
    isActive: { type: Boolean, default: true },
    expiresAt: { type: Date },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, collection: 'permission_bundles' }
);

permissionBundleSchema.index({ companyId: 1, key: 1 }, { unique: true });

module.exports = mongoose.model('PermissionBundle', permissionBundleSchema);

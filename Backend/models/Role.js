const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema(
  {
    module: { type: String, required: true, trim: true, lowercase: true },
    actions: [{ type: String, trim: true, lowercase: true }],
    scopes: [{ type: String, trim: true, lowercase: true }],
  },
  { _id: false }
);

const roleSchema = new mongoose.Schema(
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
    category: { type: String, trim: true, lowercase: true },
    isSystem: { type: Boolean, default: false },
    isHeadOffice: { type: Boolean, default: false },
    managerEnabled: { type: Boolean, default: false },
    permissions: { type: [permissionSchema], default: [] },
    fieldAccess: { type: mongoose.Schema.Types.Mixed, default: {} },
    isActive: { type: Boolean, default: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, collection: 'roles' }
);

roleSchema.index({ companyId: 1, key: 1 }, { unique: true });
roleSchema.index({ companyId: 1, name: 1 });

module.exports = mongoose.model('Role', roleSchema);

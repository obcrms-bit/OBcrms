const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      enum: ['global', 'regional', 'test_prep', 'consultancy', 'custom'],
      default: 'consultancy',
      index: true,
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'archived'],
      default: 'active',
      index: true,
    },
    countries: [
      {
        type: String,
        trim: true,
      },
    ],
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    configuration: {
      branding: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
      },
      workflows: {
        type: [mongoose.Schema.Types.Mixed],
        default: [],
      },
      roles: {
        type: [mongoose.Schema.Types.Mixed],
        default: [],
      },
      pipelineStages: {
        type: [mongoose.Schema.Types.Mixed],
        default: [],
      },
      checklistLibrary: {
        type: [mongoose.Schema.Types.Mixed],
        default: [],
      },
      automations: {
        type: [mongoose.Schema.Types.Mixed],
        default: [],
      },
      notificationTemplates: {
        type: [mongoose.Schema.Types.Mixed],
        default: [],
      },
      dashboard: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
      },
      publicForms: {
        type: [mongoose.Schema.Types.Mixed],
        default: [],
      },
      assignmentRules: {
        type: [mongoose.Schema.Types.Mixed],
        default: [],
      },
      featureFlags: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
      },
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    collection: 'templates',
  }
);

module.exports = mongoose.model('Template', templateSchema);

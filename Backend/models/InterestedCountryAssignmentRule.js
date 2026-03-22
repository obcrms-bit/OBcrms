const mongoose = require('mongoose');

const interestedCountryAssignmentRuleSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    countryCode: {
      type: String,
      trim: true,
      uppercase: true,
      default: '',
    },
    countryName: {
      type: String,
      required: true,
      trim: true,
    },
    defaultBranchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      default: null,
    },
    primaryAssigneeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    secondaryAssigneeIds: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      default: [],
    },
    defaultRoleType: {
      type: String,
      trim: true,
      default: '',
    },
    specialistTeamName: {
      type: String,
      trim: true,
      default: '',
    },
    assignmentStrategy: {
      type: String,
      enum: [
        'primary_first',
        'round_robin',
        'lowest_active_load',
        'best_conversion_history',
        'priority_queue',
        'manual',
      ],
      default: 'primary_first',
    },
    fallbackStrategy: {
      type: String,
      enum: [
        'round_robin',
        'lowest_active_load',
        'best_conversion_history',
        'destination_specialist',
        'branch_default_assignee',
        'manual',
      ],
      default: 'lowest_active_load',
    },
    priorityOrder: {
      type: Number,
      default: 0,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
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
    collection: 'interested_country_assignment_rules',
  }
);

interestedCountryAssignmentRuleSchema.index({ companyId: 1, countryName: 1 }, { unique: true });

module.exports = mongoose.model(
  'InterestedCountryAssignmentRule',
  interestedCountryAssignmentRuleSchema
);

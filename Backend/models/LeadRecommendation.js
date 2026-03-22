const mongoose = require('mongoose');

const leadRecommendationSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      required: true,
      index: true,
    },
    recommendationType: {
      type: String,
      enum: [
        'assign_user',
        'assign_branch',
        'schedule_followup',
        'move_stage',
        'mark_urgent',
        'request_documents',
        'recommend_visit',
        'recommend_transfer',
        'recommend_reactivation',
        'recommend_lost',
        'recommend_convert',
        'reassign_user',
      ],
      required: true,
      index: true,
    },
    recommendationValue: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    explanation: {
      type: String,
      required: true,
      trim: true,
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: null,
    },
    status: {
      type: String,
      enum: ['suggested', 'accepted', 'rejected', 'executed'],
      default: 'suggested',
      index: true,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    collection: 'lead_recommendations',
  }
);

leadRecommendationSchema.index({ companyId: 1, leadId: 1, status: 1, generatedAt: -1 });

module.exports = mongoose.model('LeadRecommendation', leadRecommendationSchema);

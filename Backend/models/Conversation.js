const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    participantKey: {
      type: String,
      trim: true,
    },
    isGroup: {
      type: Boolean,
      default: false,
    },
    title: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lastMessageText: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    lastMessageType: {
      type: String,
      enum: ['text', 'emoji', 'image', 'file', 'system'],
      default: 'text',
    },
    lastMessageSender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    unreadCounts: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  {
    timestamps: true,
    collection: 'conversations',
  }
);

conversationSchema.index({ companyId: 1, participants: 1, lastMessageAt: -1 });
conversationSchema.index(
  { companyId: 1, participantKey: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isGroup: false,
      participantKey: { $exists: true, $type: 'string' },
    },
  }
);

module.exports = mongoose.model('Conversation', conversationSchema);

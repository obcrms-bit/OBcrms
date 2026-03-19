const mongoose = require('mongoose');

const participantStampSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    at: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const attachmentSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    fileName: {
      type: String,
      trim: true,
      maxlength: 150,
    },
    mimeType: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    size: {
      type: Number,
      min: 0,
    },
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    text: {
      type: String,
      trim: true,
      maxlength: 4000,
      default: '',
    },
    messageType: {
      type: String,
      enum: ['text', 'emoji', 'image', 'file', 'system'],
      default: 'text',
    },
    attachment: attachmentSchema,
    isSeen: {
      type: Boolean,
      default: false,
      index: true,
    },
    deliveredAt: Date,
    seenAt: Date,
    deliveredTo: [participantStampSchema],
    seenBy: [participantStampSchema],
  },
  {
    timestamps: true,
    collection: 'messages',
  }
);

messageSchema.index({ conversation: 1, createdAt: 1 });
messageSchema.index({ receiver: 1, isSeen: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);

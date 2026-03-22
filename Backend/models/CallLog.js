const mongoose = require('mongoose');

const callLogSchema = new mongoose.Schema({
  leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: false },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: false },
  type: { type: String, enum: ['Incoming', 'Outgoing'], required: true },
  duration: { type: String, required: true }, // e.g., '5 mins'
  outcome: { type: String, required: true },
  notes: { type: String },
  followUpLinked: { type: Boolean, default: false },
  handledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  callDate: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CallLog', callLogSchema);

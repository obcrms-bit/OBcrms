const mongoose = require('mongoose');

const officeVisitSchema = new mongoose.Schema({
  leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: false },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: false },
  visitDate: { type: Date, required: true },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: false },
  handledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  visitOutcome: { type: String, required: true },
  notes: { type: String },
  nextAction: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('OfficeVisit', officeVisitSchema);

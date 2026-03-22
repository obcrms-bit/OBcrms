const mongoose = require('mongoose');

const careerInterestProfileSchema = new mongoose.Schema({
  leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: false },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: false },
  desiredLevel: { 
    type: String, 
    enum: ['Undergraduate', 'Postgraduate', 'PhD', 'Diploma', 'Certificate'],
    required: true 
  },
  targetPrograms: [{ type: String }],
  careerGoal: { type: String },
  preferredCountries: [{ type: String }], // e.g. ["Australia", "Canada"]
  budgetRange: { type: String }, // e.g., "$10k-$20k", "$20k-$30k"
  scholarshipInterest: { type: Boolean, default: false },
  intakePreference: { type: String }, // e.g., "Fall 2026", "Spring 2027"
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CareerInterestProfile', careerInterestProfileSchema);

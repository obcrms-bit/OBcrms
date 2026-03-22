const mongoose = require('mongoose');

const courseCatalogSchema = new mongoose.Schema({
  institutionName: { type: String, required: true }, // Replaces institutionId for simplicity if we don't strictly have Institution model
  institutionId: { type: mongoose.Schema.Types.ObjectId, ref: 'University', required: false },
  country: { type: String, required: true },
  courseName: { type: String, required: true },
  level: { type: String, required: true }, // e.g., 'Masters', 'Bachelors'
  field: { type: String, required: true }, // e.g., 'Computer Science', 'Business'
  intake: [{ type: String }], // e.g., ['Fall', 'Spring']
  duration: { type: String }, // e.g., '2 years'
  tuition: { type: Number }, // Amount per year
  tuitionCurrency: { type: String, default: 'USD' },
  eligibilityRules: {
    minimumGPA: { type: Number, default: 0 },
    minimumPercentage: { type: Number, default: 0 },
    allowedBacklogs: { type: Number, default: 0 },
    maximumGapYears: { type: Number, default: 0 }
  },
  languageRequirements: {
    minimumIelts: { type: Number, default: 0 },
    minimumPte: { type: Number, default: 0 },
    minimumToefl: { type: Number, default: 0 },
    minimumDuolingo: { type: Number, default: 0 }
  },
  academicRequirements: { type: String }, // Description of degree requirements
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CourseCatalog', courseCatalogSchema);

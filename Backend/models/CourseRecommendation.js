const mongoose = require('mongoose');

const courseRecommendationSchema = new mongoose.Schema({
  leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: false },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: false },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'CourseCatalog', required: true },
  matchScore: { type: Number, required: true }, // 0 to 100
  recommendationType: { 
    type: String, 
    enum: ['Best Match', 'Safe Match', 'Moderate Match', 'Aspirational Match', 'Not Eligible', 'Alternative Pathway'],
    required: true 
  },
  eligibilityStatus: { 
    type: String, 
    enum: ['Eligible', 'Conditionally Eligible', 'Not Eligible'],
    required: true 
  },
  explanation: { type: String }, // Why recommended or not eligible
  isShortlisted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CourseRecommendation', courseRecommendationSchema);

const mongoose = require('mongoose');

const studentAcademicProfileSchema = new mongoose.Schema({
  leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: false },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: false },
  qualificationLevel: { 
    type: String, 
    enum: ['High School', 'Bachelors', 'Masters', 'Diploma', 'Other'],
    required: true 
  },
  academicScore: { type: Number, required: true }, // E.g., GPA or Percentage
  gradingType: { 
    type: String, 
    enum: ['GPA', 'Percentage', 'CGPA', 'Grades'], 
    default: 'Percentage' 
  },
  stream: { type: String, required: true },
  completionYear: { type: Number, required: true },
  studyGap: { type: Number, default: 0 }, // In years
  backlogCount: { type: Number, default: 0 },
  institutionName: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('StudentAcademicProfile', studentAcademicProfileSchema);

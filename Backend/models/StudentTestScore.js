const mongoose = require('mongoose');

const studentTestScoreSchema = new mongoose.Schema({
  leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: false },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: false },
  testType: { 
    type: String, 
    enum: ['IELTS', 'PTE', 'TOEFL', 'Duolingo', 'GRE', 'GMAT', 'SAT', 'Internal'],
    required: true 
  },
  overallScore: { type: Number, required: true },
  sectionScores: { 
    reading: { type: Number },
    writing: { type: Number },
    listening: { type: Number },
    speaking: { type: Number },
    // for other tests like SAT, GRE
    verbal: { type: Number },
    quant: { type: Number },
    analytical: { type: Number }
  },
  testDate: { type: Date, required: true },
  expiryDate: { type: Date, required: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('StudentTestScore', studentTestScoreSchema);

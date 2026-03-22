const CourseCatalog = require('../models/CourseCatalog');
const StudentAcademicProfile = require('../models/StudentAcademicProfile');
const StudentTestScore = require('../models/StudentTestScore');
const CareerInterestProfile = require('../models/CareerInterestProfile');
const CourseRecommendation = require('../models/CourseRecommendation');

// Helper to determine match score
const calculateMatchScore = (course, academic, tests, career) => {
  let score = 100;
  let deductions = 0;
  let explanation = [];

  // 1. Eligibility rules
  if (academic && course.eligibilityRules) {
    if (academic.academicScore < course.eligibilityRules.minimumPercentage) {
      deductions += 30;
      explanation.push(`Academic score (${academic.academicScore}) is below minimum (${course.eligibilityRules.minimumPercentage}).`);
    } else {
      explanation.push('Meets academic requirements.');
    }

    if (academic.studyGap > course.eligibilityRules.maximumGapYears) {
      deductions += 20;
      explanation.push(`Study gap (${academic.studyGap} yrs) exceeds maximum allowed (${course.eligibilityRules.maximumGapYears} yrs).`);
    }
  } else {
     deductions += 10;
     explanation.push('Missing academic profile data.');
  }

  // 2. Language requirements
  if (course.languageRequirements) {
    const ielts = tests.find(t => t.testType === 'IELTS');
    if (ielts && ielts.overallScore >= course.languageRequirements.minimumIelts) {
      explanation.push(`Meets IELTS requirements (${ielts.overallScore}).`);
    } else if (course.languageRequirements.minimumIelts > 0) {
      deductions += 25;
      explanation.push(`IELTS score below minimum or missing.`);
    }
  }

  // 3. Career alignment
  if (career) {
    if (career.preferredCountries && !career.preferredCountries.includes(course.country)) {
      deductions += 15;
      explanation.push(`Course country (${course.country}) is not in preferred list.`);
    } else {
      explanation.push(`Country aligns with preferences.`);
    }

    if (career.desiredLevel && career.desiredLevel !== course.level) {
      deductions += 20;
      explanation.push(`Course level (${course.level}) may not match desired level (${career.desiredLevel}).`);
    }
  }

  score = Math.max(0, score - deductions);

  let type = 'Best Match';
  let eligibility = 'Eligible';

  if (score >= 85) {
     type = 'Best Match';
  } else if (score >= 70) {
     type = 'Safe Match';
  } else if (score >= 50) {
     type = 'Moderate Match';
     eligibility = 'Conditionally Eligible';
  } else if (score >= 30) {
     type = 'Aspirational Match';
     eligibility = 'Conditionally Eligible';
  } else {
     type = 'Not Eligible';
     eligibility = 'Not Eligible';
  }

  return {
    score,
    type,
    eligibility,
    explanation: explanation.join(' ')
  };
};

exports.generateRecommendations = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query; // 'lead' or 'student'
    const queryObj = type === 'student' ? { studentId: id } : { leadId: id };

    // Fetch student data
    const [academic, tests, career] = await Promise.all([
      StudentAcademicProfile.findOne(queryObj),
      StudentTestScore.find(queryObj),
      CareerInterestProfile.findOne(queryObj)
    ]);

    // Fetch all courses (or limit based on basic filters if catalog is huge)
    const courses = await CourseCatalog.find({});

    const recommendationDocs = courses.map(course => {
      const { score, type: matchType, eligibility, explanation } = calculateMatchScore(course, academic, tests, career);
      
      return {
        ...queryObj,
        courseId: course._id,
        matchScore: score,
        recommendationType: matchType,
        eligibilityStatus: eligibility,
        explanation
      };
    });

    // Delete existing run
    await CourseRecommendation.deleteMany(queryObj);

    // Save new recommendations
    const savedRecs = await CourseRecommendation.insertMany(recommendationDocs);

    const populatedRecs = await CourseRecommendation.find(queryObj)
        .populate('courseId')
        .sort({ matchScore: -1 });

    res.status(200).json({ success: true, data: populatedRecs });

  } catch (error) {
    console.error('Course AI Error:', error);
    res.status(500).json({ success: false, message: 'Server Error Generating Recommendations' });
  }
};

exports.toggleShortlist = async (req, res) => {
  try {
    const { id: recommendationId } = req.params;
    const { isShortlisted } = req.body;

    const rec = await CourseRecommendation.findByIdAndUpdate(
      recommendationId, 
      { isShortlisted }, 
      { new: true }
    ).populate('courseId');

    res.status(200).json({ success: true, data: rec });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error Shortlisting' });
  }
};

exports.getRecommendations = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query;
    const queryObj = type === 'student' ? { studentId: id } : { leadId: id };

    const recs = await CourseRecommendation.find(queryObj)
      .populate('courseId')
      .sort({ matchScore: -1 });

    res.status(200).json({ success: true, data: recs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error Fetching Recommendations' });
  }
};

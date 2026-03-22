const CourseCatalog = require('../models/CourseCatalog');
const StudentAcademicProfile = require('../models/StudentAcademicProfile');
const StudentTestScore = require('../models/StudentTestScore');
const CareerInterestProfile = require('../models/CareerInterestProfile');
const CourseRecommendation = require('../models/CourseRecommendation');
const { calculateMatchScore } = require('../utils/courseAi.util');

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

    const recommendationDocs = courses.map((course) => {
      const { score, recommendationType, eligibilityStatus, explanation } = calculateMatchScore(
        course,
        academic,
        tests,
        career
      );

      return {
        ...queryObj,
        courseId: course._id,
        matchScore: score,
        recommendationType,
        eligibilityStatus,
        explanation,
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

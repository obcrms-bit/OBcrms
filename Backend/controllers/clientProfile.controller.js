const Lead = require('../models/Lead');
const Student = require('../models/Student');
const StudentAcademicProfile = require('../models/StudentAcademicProfile');
const StudentTestScore = require('../models/StudentTestScore');
const CareerInterestProfile = require('../models/CareerInterestProfile');
const Note = require('../models/Note');
const CallLog = require('../models/CallLog');
const OfficeVisit = require('../models/OfficeVisit');
const LeadActivityLog = require('../models/LeadActivityLog');
const CourseRecommendation = require('../models/CourseRecommendation');
const { refreshLeadIntelligence } = require('../services/leadIntelligence.service');

exports.getFullProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query; // 'lead' or 'student'

    let profileData = null;
    let queryObj = {};

    if (type === 'student') {
      profileData = await Student.findById(id).populate('assignedTo branchId');
      queryObj = { studentId: id };
    } else {
      profileData = await Lead.findById(id).populate('assignedTo branchId');
      queryObj = { leadId: id };
    }

    if (!profileData) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    const [
      academicProfile,
      testScores,
      careerInterest,
      notes,
      callLogs,
      officeVisits,
      activityLogs,
      courseRecommendations
    ] = await Promise.all([
      StudentAcademicProfile.findOne(queryObj),
      StudentTestScore.find(queryObj),
      CareerInterestProfile.findOne(queryObj),
      Note.find(queryObj).populate('author', 'firstName lastName').sort({ createdAt: -1 }),
      CallLog.find(queryObj).populate('handledBy', 'firstName lastName').sort({ createdAt: -1 }),
      OfficeVisit.find(queryObj).populate('handledBy', 'firstName lastName').sort({ createdAt: -1 }),
      LeadActivityLog.find(type === 'lead' ? { leadId: id } : { metadata: { studentId: id } }).populate('createdBy', 'firstName lastName').sort({ createdAt: -1 }),
      CourseRecommendation.find(queryObj).populate('courseId').sort({ createdAt: -1 })
    ]);

    return res.status(200).json({
      success: true,
      data: {
        profile: profileData,
        academicProfile,
        testScores,
        careerInterest,
        notes,
        callLogs,
        officeVisits,
        activityLogs,
        courseRecommendations
      }
    });

  } catch (error) {
    console.error('Error in getFullProfile:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.addNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query;
    const { content, isInternal } = req.body;

    const note = new Note({
      content,
      isInternal,
      author: req.user.id
    });

    if (type === 'student') note.studentId = id;
    else note.leadId = id;

    await note.save();

    res.status(201).json({ success: true, data: note });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.addCallLog = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query;
    const payload = req.body;

    const callLog = new CallLog({
      ...payload,
      handledBy: req.user.id
    });

    if (type === 'student') callLog.studentId = id;
    else callLog.leadId = id;

    await callLog.save();
    if (type !== 'student') {
      const lead = await Lead.findById(id);
      if (lead) {
        await refreshLeadIntelligence({
          companyId: lead.companyId,
          lead,
          actorId: req.user?._id || req.user?.id || null,
          persist: true,
          triggerType: 'ai_refresh',
        });
      }
    }

    res.status(201).json({ success: true, data: callLog });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.addOfficeVisit = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query;
    const payload = req.body;

    const visit = new OfficeVisit({
      ...payload,
      handledBy: req.user.id
    });

    if (type === 'student') visit.studentId = id;
    else visit.leadId = id;

    await visit.save();
    if (type !== 'student') {
      const lead = await Lead.findById(id);
      if (lead) {
        await refreshLeadIntelligence({
          companyId: lead.companyId,
          lead,
          actorId: req.user?._id || req.user?.id || null,
          persist: true,
          triggerType: 'ai_refresh',
        });
      }
    }

    res.status(201).json({ success: true, data: visit });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.updateProfileData = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query;
    const { academicProfile, testScores, careerInterest } = req.body;
    const queryObj = type === 'student' ? { studentId: id } : { leadId: id };

    if (academicProfile) {
      await StudentAcademicProfile.findOneAndUpdate(queryObj, { ...academicProfile, ...queryObj }, { upsert: true, new: true });
    }
     
    // Simplified test score handling to just add/update what's sent. Complex sync might be needed in a real app.
    if (testScores && testScores.length > 0) {
      // Clear existing for simplicity and add new ones (or could upsert by testType)
      await StudentTestScore.deleteMany(queryObj);
      const toInsert = testScores.map((ts) => ({ ...ts, ...queryObj }));
      await StudentTestScore.insertMany(toInsert);
    }

    if (careerInterest) {
      await CareerInterestProfile.findOneAndUpdate(queryObj, { ...careerInterest, ...queryObj }, { upsert: true, new: true });
    }

    res.status(200).json({ success: true, message: 'Profile data updated successfully' });
  } catch (error) {
    console.error('Error in updateProfileData:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

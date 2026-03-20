const Student = require('../models/Student');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const { isValidTransition } = require('../constants/workflow');
const mongoose = require('mongoose');
const {
  buildScopedClause,
  getUserBranchIds,
  hasPermission,
  mergeFiltersWithAnd,
  toObjectIdString,
} = require('../services/accessControl.service');

const getScopedStudentFilter = async (req, extra = {}) =>
  mergeFiltersWithAnd(
    { companyId: new mongoose.Types.ObjectId(req.companyId), deletedAt: null },
    await buildScopedClause(req.user, 'leads', {
      branchField: 'branchId',
      assigneeFields: ['assignedCounselor'],
      creatorFields: ['createdByUser'],
      ownerFields: ['assignedCounselor'],
    }),
    extra
  );

const canManageStudent = (user, student) => {
  if (user?.effectiveAccess?.isHeadOffice || hasPermission(user, 'leads', 'manage')) {
    return true;
  }

  if (String(student.assignedCounselor || '') === String(user?._id || '')) {
    return true;
  }

  const userBranchIds = getUserBranchIds(user);
  return userBranchIds.includes(toObjectIdString(student.branchId)) && hasPermission(user, 'leads', 'edit');
};

exports.getStudents = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const query = await getScopedStudentFilter(req);

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const students = await Student.find(query)
      .populate('assignedCounselor', 'name email role')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Student.countDocuments(query);

    return sendSuccess(res, 200, 'Students retrieved successfully', {
      students,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch students', error.message);
  }
};

exports.getStudentById = async (req, res) => {
  try {
    const student = await Student.findOne(await getScopedStudentFilter(req, { _id: req.params.id })).populate(
      'assignedCounselor',
      'name email role'
    );
    if (!student) return sendError(res, 404, 'Student not found');
    return sendSuccess(res, 200, 'Student details retrieved', student);
  } catch (error) {
    return sendError(res, 400, 'Invalid student ID', error.message);
  }
};

exports.createStudent = async (req, res) => {
  try {
    const student = await Student.create({
      ...req.body,
      companyId: new mongoose.Types.ObjectId(req.companyId),
      createdByUser: req.user?._id,
      serviceType: req.body.serviceType || 'consultancy',
      entityType: req.body.serviceType === 'test_prep' ? 'student' : 'client',
    });

    await AuditLog.logAction({
      companyId: req.companyId,
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'create',
      resource: 'student',
      resourceId: student._id,
      resourceName: student.fullName,
    });

    return sendSuccess(res, 201, 'Student created successfully', student);
  } catch (error) {
    return sendError(res, 400, 'Failed to create student', error.message);
  }
};

exports.updateStudent = async (req, res) => {
  try {
    const student = await Student.findOneAndUpdate(
      await getScopedStudentFilter(req, { _id: req.params.id }),
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!student) return sendError(res, 404, 'Student not found');
    if (!canManageStudent(req.user, student)) {
      return sendError(res, 403, 'You do not have permission to update this record');
    }

    await AuditLog.logAction({
      companyId: req.companyId,
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'update',
      resource: 'student',
      resourceId: student._id,
      resourceName: student.fullName,
      changes: { after: req.body },
    });

    return sendSuccess(res, 200, 'Student updated successfully', student);
  } catch (error) {
    return sendError(res, 400, 'Failed to update student', error.message);
  }
};

exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findOneAndUpdate(
      await getScopedStudentFilter(req, { _id: req.params.id }),
      { deletedAt: new Date() },
      { new: true }
    );

    if (!student) return sendError(res, 404, 'Student not found');

    await AuditLog.logAction({
      companyId: req.companyId,
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'delete',
      resource: 'student',
      resourceId: student._id,
      resourceName: student.fullName,
    });

    return sendSuccess(res, 200, 'Student deleted successfully (soft delete)');
  } catch (error) {
    return sendError(res, 400, 'Failed to delete student', error.message);
  }
};

exports.updateStudentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const student = await Student.findOne(await getScopedStudentFilter(req, { _id: id }));
    if (!student) return sendError(res, 404, 'Student not found');
    if (!canManageStudent(req.user, student)) {
      return sendError(res, 403, 'You do not have permission to update this student');
    }

    if (!isValidTransition('STUDENT', student.status, status)) {
      return sendError(res, 400, `Invalid status transition from ${student.status} to ${status}`);
    }

    const oldStatus = student.status;
    student.status = status;
    await student.save();

    await AuditLog.logAction({
      companyId: req.companyId,
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'update',
      resource: 'student',
      resourceId: student._id,
      resourceName: student.fullName,
      changes: { before: { status: oldStatus }, after: { status } },
    });

    return sendSuccess(res, 200, 'Student status updated', student);
  } catch (error) {
    return sendError(res, 400, 'Failed to update student status', error.message);
  }
};

exports.assignCounselor = async (req, res) => {
  try {
    const { counselorId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(counselorId)) {
      return sendError(res, 400, 'Valid counselorId is required');
    }

    const counselor = await User.findOne({
      _id: counselorId,
      companyId: new mongoose.Types.ObjectId(req.companyId),
      isActive: true,
      role: { $in: ['counselor', 'manager', 'follow_up_team', 'branch_manager'] },
    }).select('name email role');

    if (!counselor) {
      return sendError(res, 404, 'Counselor not found in your company');
    }

    const student = await Student.findOneAndUpdate(
      await getScopedStudentFilter(req, { _id: req.params.id }),
      { $set: { assignedCounselor: counselor._id } },
      { new: true, runValidators: true }
    ).populate('assignedCounselor', 'name email role');

    if (!student) return sendError(res, 404, 'Student not found');

    await AuditLog.logAction({
      companyId: req.companyId,
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'assign_counselor',
      resource: 'student',
      resourceId: student._id,
      resourceName: student.fullName,
      changes: {
        after: {
          assignedCounselor: counselor._id,
          assignedCounselorName: counselor.name,
        },
      },
    });

    return sendSuccess(res, 200, 'Counselor assigned successfully', {
      student,
      counselor,
    });
  } catch (error) {
    return sendError(res, 400, 'Failed to assign counselor', error.message);
  }
};

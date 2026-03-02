const Student = require("../models/Student");
const AuditLog = require("../models/AuditLog");
const { sendSuccess, sendError } = require("../utils/responseHandler");
const { isValidTransition } = require("../constants/workflow");
const mongoose = require("mongoose");

exports.getStudents = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;
    const companyObjectId = new mongoose.Types.ObjectId(req.companyId);
    const query = { companyId: companyObjectId, deletedAt: null };

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const students = await Student.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Student.countDocuments(query);

    return sendSuccess(res, 200, "Students retrieved successfully", {
      students,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
    });
  } catch (error) {
    return sendError(res, 500, "Failed to fetch students", error.message);
  }
};

exports.getStudentById = async (req, res) => {
  try {
    const student = await Student.findOne({
      _id: req.params.id,
      companyId: new mongoose.Types.ObjectId(req.companyId),
      deletedAt: null
    });
    if (!student) return sendError(res, 404, "Student not found");
    return sendSuccess(res, 200, "Student details retrieved", student);
  } catch (error) {
    return sendError(res, 400, "Invalid student ID", error.message);
  }
};

exports.createStudent = async (req, res) => {
  try {
    const student = await Student.create({
      ...req.body,
      companyId: new mongoose.Types.ObjectId(req.companyId),
    });

    await AuditLog.logAction({
      companyId: req.companyId,
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: "create",
      resource: "student",
      resourceId: student._id,
      resourceName: student.fullName,
    });

    return sendSuccess(res, 201, "Student created successfully", student);
  } catch (error) {
    return sendError(res, 400, "Failed to create student", error.message);
  }
};

exports.updateStudent = async (req, res) => {
  try {
    const student = await Student.findOneAndUpdate(
      { _id: req.params.id, companyId: new mongoose.Types.ObjectId(req.companyId) },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!student) return sendError(res, 404, "Student not found");

    await AuditLog.logAction({
      companyId: req.companyId,
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: "update",
      resource: "student",
      resourceId: student._id,
      resourceName: student.fullName,
      changes: { after: req.body },
    });

    return sendSuccess(res, 200, "Student updated successfully", student);
  } catch (error) {
    return sendError(res, 400, "Failed to update student", error.message);
  }
};

exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findOneAndUpdate(
      { _id: req.params.id, companyId: new mongoose.Types.ObjectId(req.companyId) },
      { deletedAt: new Date() },
      { new: true }
    );

    if (!student) return sendError(res, 404, "Student not found");

    await AuditLog.logAction({
      companyId: req.companyId,
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: "delete",
      resource: "student",
      resourceId: student._id,
      resourceName: student.fullName,
    });

    return sendSuccess(res, 200, "Student deleted successfully (soft delete)");
  } catch (error) {
    return sendError(res, 400, "Failed to delete student", error.message);
  }
};

exports.updateStudentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const companyObjectId = new mongoose.Types.ObjectId(req.companyId);

    const student = await Student.findOne({ _id: id, companyId: companyObjectId });
    if (!student) return sendError(res, 404, "Student not found");

    if (!isValidTransition("STUDENT", student.status, status)) {
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
      action: "update",
      resource: "student",
      resourceId: student._id,
      resourceName: student.fullName,
      changes: { before: { status: oldStatus }, after: { status } },
    });

    return sendSuccess(res, 200, "Student status updated", student);
  } catch (error) {
    return sendError(res, 400, "Failed to update student status", error.message);
  }
};

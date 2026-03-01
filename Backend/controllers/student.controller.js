const Student = require("../models/student.model");
const User = require("../models/user.model");
const AuditLog = require("../models/AuditLog");
const { sendSuccess, sendError } = require("../utils/responseHandler");
const {
  buildTenantQuery,
  executeSafeQuery,
  verifyOwnership,
  getPaginatedResults,
  applyRoleBasedFilter,
  createAuditLog,
} = require("../utils/tenantContext");

// ==================== CREATE STUDENT ====================
// Only admin/manager can create students
exports.createStudent = async (req, res) => {
  try {
    const { fullName, email, phone, countryInterested, status, notes } = req.body;
    const companyId = req.companyId;
    const userId = req.userId;

    // Validate required fields
    if (!fullName || !email) {
      return sendError(res, 400, "fullName and email are required");
    }

    // Check if email is unique within company
    const existing = await Student.findOne(buildTenantQuery(req, { email }));
    if (existing) {
      return sendError(res, 409, "Student with this email already exists in your company");
    }

    // Create student with companyId
    const student = new Student({
      companyId,
      fullName,
      email,
      phone,
      countryInterested,
      status: status || "New",
      notes,
    });
    await student.save();

    // Create audit log
    await createAuditLog(req, "CREATE", "Student", student._id, {
      fullName,
      email,
      phone,
      countryInterested,
      status,
      notes,
    });

    sendSuccess(res, 201, "Student created successfully", student);
  } catch (error) {
    sendError(res, 500, "Failed to create student", error.message);
  }
};

// ==================== GET ALL STUDENTS ====================
// Admin/Manager: see all students
// Counselor: see only assigned students
exports.getAllStudents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const status = req.query.status || "";
    const companyId = req.companyId;
    const userRole = req.user.role;
    const userId = req.userId;

    // Build base filter with tenant isolation
    let filter = { companyId };

    // Apply role-based filtering (counselors only see assigned students)
    if (userRole === "counselor") {
      filter.assignedCounselor = userId;
    }

    // Apply status filter if provided
    if (status) {
      filter.status = status;
    }

    // Apply search filter
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    // Get paginated results
    const result = await getPaginatedResults(req, Student, filter, page, limit);

    // Populate counselor info
    const students = await Student.find(filter)
      .populate("assignedCounselor", "name email phone")
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    sendSuccess(res, 200, "Students retrieved successfully", {
      students,
      pagination: result.pagination,
    });
  } catch (error) {
    sendError(res, 500, "Failed to retrieve students", error.message);
  }
};

// ==================== GET STUDENT BY ID ====================
// Verify student belongs to user's company
// Counselors can only view assigned students
exports.getStudentById = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.companyId;
    const userRole = req.user.role;
    const userId = req.userId;

    // Fetch student with company isolation
    const student = await Student.findOne({
      _id: id,
      companyId, // CRITICAL: Tenant isolation
    }).populate("assignedCounselor", "name email phone");

    if (!student) {
      return sendError(res, 404, "Student not found");
    }

    // Counselor access control: can only view assigned students
    if (userRole === "counselor") {
      if (!student.assignedCounselor || student.assignedCounselor._id.toString() !== userId.toString()) {
        return sendError(res, 403, "You can only view your assigned students");
      }
    }

    sendSuccess(res, 200, "Student retrieved successfully", student);
  } catch (error) {
    sendError(res, 500, "Failed to retrieve student", error.message);
  }
};

// ==================== UPDATE STUDENT ====================
// Verify student belongs to company
// Counselors can only update assigned students (limited fields)
exports.updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.companyId;
    const userRole = req.user.role;
    const userId = req.userId;
    const updates = { ...req.body };

    // Remove protected fields
    delete updates.companyId; // Can't change company
    updates.updatedAt = Date.now();

    // Verify ownership: student belongs to this company
    const student = await Student.findOne({ _id: id, companyId });
    if (!student) {
      return sendError(res, 404, "Student not found or access denied");
    }

    // Counselor access control
    if (userRole === "counselor") {
      if (!student.assignedCounselor || student.assignedCounselor.toString() !== userId.toString()) {
        return sendError(res, 403, "You can only update your assigned students");
      }
      // Counselors can only update notes, not critical fields
      delete updates.assignedCounselor;
      delete updates.status;
    }

    // Store original data for audit log
    const originalData = student.toObject();

    // Update student
    const updated = await Student.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).populate("assignedCounselor", "name email phone");

    if (!updated) {
      return sendError(res, 404, "Student not found");
    }

    // Create audit log with before/after data
    await AuditLog.create({
      companyId,
      userId,
      action: "UPDATE",
      resource: "Student",
      resourceId: id,
      changes: {
        before: originalData,
        after: updated.toObject(),
      },
      timestamp: new Date(),
    });

    sendSuccess(res, 200, "Student updated successfully", updated);
  } catch (error) {
    sendError(res, 500, "Failed to update student", error.message);
  }
};

// ==================== DELETE STUDENT ====================
// Only admin/manager can delete
// Verify student belongs to company
exports.deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.companyId;
    const userId = req.userId;

    // Verify student belongs to this company
    const student = await Student.findOne({ _id: id, companyId });
    if (!student) {
      return sendError(res, 404, "Student not found or access denied");
    }

    // Store data for audit log before deletion
    const deletedData = student.toObject();

    // Soft delete or hard delete
    // For now: hard delete, but can change to soft delete with isDeleted flag
    await Student.findByIdAndDelete(id);

    // Create audit log
    await AuditLog.create({
      companyId,
      userId,
      action: "DELETE",
      resource: "Student",
      resourceId: id,
      changes: {
        deleted: deletedData,
      },
      timestamp: new Date(),
    });

    sendSuccess(res, 200, "Student deleted successfully", {
      id: student._id,
      fullName: student.fullName,
    });
  } catch (error) {
    sendError(res, 500, "Failed to delete student", error.message);
  }
};

// ==================== ASSIGN COUNSELOR ====================
// Only admin/manager can assign
// Verify counselor belongs to company
exports.assignCounselor = async (req, res) => {
  try {
    const { id } = req.params;
    const { counselorId } = req.body;
    const companyId = req.companyId;
    const userId = req.userId;

    if (!counselorId) {
      return sendError(res, 400, "Counselor ID is required");
    }

    // Verify student belongs to this company
    const student = await Student.findOne({ _id: id, companyId });
    if (!student) {
      return sendError(res, 404, "Student not found");
    }

    // Verify counselor belongs to this company and is a counselor
    const counselor = await User.findOne({
      _id: counselorId,
      companyId,
      role: "counselor",
    });
    if (!counselor) {
      return sendError(res, 404, "Counselor not found in your company");
    }

    // Store original data
    const originalData = student.toObject();

    // Update assignment
    const updated = await Student.findByIdAndUpdate(
      id,
      {
        assignedCounselor: counselorId,
        updatedAt: Date.now(),
      },
      { new: true, runValidators: true }
    ).populate("assignedCounselor", "name email phone");

    // Create audit log
    await AuditLog.create({
      companyId,
      userId,
      action: "UPDATE",
      resource: "Student",
      resourceId: id,
      changes: {
        field: "assignedCounselor",
        before: originalData.assignedCounselor,
        after: counselorId,
      },
      timestamp: new Date(),
    });

    sendSuccess(res, 200, "Counselor assigned successfully", updated);
  } catch (error) {
    sendError(res, 500, "Failed to assign counselor", error.message);
  }
};

// ==================== ADD STUDENT NOTE ====================
// All users (admin/manager/counselor) can add notes
exports.addStudentNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const companyId = req.companyId;
    const userId = req.userId;

    if (!message) {
      return sendError(res, 400, "Message is required");
    }

    // Verify student belongs to company
    const student = await Student.findOne({ _id: id, companyId });
    if (!student) {
      return sendError(res, 404, "Student not found");
    }

    // For counselors, verify it's their assigned student
    const userRole = req.user.role;
    if (userRole === "counselor") {
      if (!student.assignedCounselor || student.assignedCounselor.toString() !== userId.toString()) {
        return sendError(res, 403, "You can only add notes to your assigned students");
      }
    }

    // Get user for note creation
    const user = await User.findById(userId);

    // Add communication/note
    const newNote = {
      createdBy: userId,
      createdByName: user.name,
      message,
      type: "note",
      createdAt: new Date(),
    };

    student.communicationHistory = student.communicationHistory || [];
    student.communicationHistory.push(newNote);
    student.updatedAt = Date.now();

    await student.save();

    // Create audit log
    await AuditLog.create({
      companyId,
      userId,
      action: "CREATE",
      resource: "StudentNote",
      resourceId: id,
      changes: {
        note: message,
      },
      timestamp: new Date(),
    });

    sendSuccess(res, 201, "Note added successfully", {
      id: student._id,
      note: newNote,
    });
  } catch (error) {
    sendError(res, 500, "Failed to add note", error.message);
  }
};

// ==================== GET STUDENT STATISTICS ====================
// Dashboard stats for company
exports.getStudentStats = async (req, res) => {
  try {
    const companyId = req.companyId;

    // Count students by status
    const total = await Student.countDocuments({ companyId });
    const processing = await Student.countDocuments({ companyId, status: "Processing" });
    const applied = await Student.countDocuments({ companyId, status: "Applied" });
    const byCountry = await Student.aggregate([
      { $match: { companyId } },
      { $group: { _id: "$countryInterested", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    sendSuccess(res, 200, "Student statistics retrieved", {
      total,
      processing,
      applied,
      byCountry,
    });
  } catch (error) {
    sendError(res, 500, "Failed to retrieve statistics", error.message);
  }
};

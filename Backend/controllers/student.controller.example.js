/**
 * Student Controller - Multi-Tenant Version
 * 
 * Key Points:
 * 1. All queries get automatic company filtering
 * 2. Data ownership verified before modifications
 * 3. Audit logs created for all actions
 * 4. Role-based logic for counselor restrictions
 */

const Student = require("../models/student.model");
const AuditLog = require("../models/AuditLog");
const {
  getTenantFilter,
  verifyOwnership,
  getPaginatedResults,
  applyRoleBasedFilter,
  createAuditLog,
} = require("../utils/tenantContext");

// ============================================
// GET: List all students for company
// ============================================
exports.getStudents = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", status = "" } = req.query;

    // Build filter with company isolation
    let filters = getTenantFilter(req);

    // Add role-based filtering (counselors see only assigned)
    if (req.user.role === "counselor") {
      filters.assignedCounselor = req.userId;
    }

    // Add search filter
    if (search) {
      filters.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    // Add status filter
    if (status) {
      filters.status = status;
    }

    // Get paginated results
    const results = await getPaginatedResults(
      req,
      Student,
      filters,
      parseInt(page),
      parseInt(limit)
    );

    res.json({
      success: true,
      message: "Students retrieved",
      data: results.data,
      pagination: {
        total: results.total,
        page: results.page,
        pages: results.pages,
        limit: results.limit,
        hasMore: results.hasMore,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve students",
      error: error.message,
    });
  }
};

// ============================================
// GET: Single student by ID
// ============================================
exports.getStudentById = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify ownership + get student
    const student = await verifyOwnership(req, Student, id);

    // For counselors: ensure they're assigned or admin
    if (req.user.role === "counselor") {
      if (student.assignedCounselor.toString() !== req.userId.toString()) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized",
          error: "You can only view students assigned to you",
        });
      }
    }

    // Populate counselor info if assigned
    if (student.assignedCounselor) {
      await student.populate("assignedCounselor", "name email phone");
    }

    res.json({
      success: true,
      message: "Student retrieved",
      data: student,
    });
  } catch (error) {
    if (error.message.includes("not found")) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to retrieve student",
      error: error.message,
    });
  }
};

// ============================================
// POST: Create new student
// ============================================
exports.createStudent = async (req, res) => {
  try {
    const { fullName, email, phone, course, countryInterested } = req.body;

    // Validate required fields
    if (!fullName || !email) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        error: "fullName and email are required",
      });
    }

    // Build student data with company isolation
    const studentData = {
      companyId: req.companyId, // ⭐ AUTOMATIC COMPANY ASSIGNMENT
      fullName,
      email,
      phone,
      course: course || "Bachelor's",
      countryInterested,
      status: "New",
    };

    // Create student
    const student = new Student(studentData);
    await student.save();

    // 📝 Create audit log
    await AuditLog.logAction({
      companyId: req.companyId,
      userId: req.userId,
      userName: req.user.name,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: "create",
      resource: "student",
      resourceId: student._id,
      resourceName: fullName,
      changes: {
        before: {},
        after: studentData,
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.status(201).json({
      success: true,
      message: "Student created successfully",
      data: student,
    });
  } catch (error) {
    // Handle duplicate email within company
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Conflict",
        error: "Email already exists for this company",
      });
    }

    res.status(400).json({
      success: false,
      message: "Failed to create student",
      error: error.message,
    });
  }
};

// ============================================
// PUT: Update student
// ============================================
exports.updateStudent = async (req, res) => {
  try {
    const { id } = req.params;

    // Step 1: Verify ownership (prevents cross-tenant updates)
    const student = await verifyOwnership(req, Student, id);

    // Step 2: For counselors, they can only update assigned students
    if (req.user.role === "counselor") {
      if (student.assignedCounselor.toString() !== req.userId.toString()) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized",
          error: "You can only update students assigned to you",
        });
      }
    }

    // Step 3: Prepare change tracking
    const beforeData = student.toObject();

    // Step 4: Update student
    const updatedStudent = await Student.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    // 📝 Create audit log with before/after
    await AuditLog.logAction({
      companyId: req.companyId,
      userId: req.userId,
      userName: req.user.name,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: "update",
      resource: "student",
      resourceId: id,
      resourceName: updatedStudent.fullName,
      changes: {
        before: beforeData,
        after: updatedStudent.toObject(),
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.json({
      success: true,
      message: "Student updated successfully",
      data: updatedStudent,
    });
  } catch (error) {
    if (error.message.includes("not found")) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    res.status(400).json({
      success: false,
      message: "Failed to update student",
      error: error.message,
    });
  }
};

// ============================================
// DELETE: Remove student
// ============================================
exports.deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    // Step 1: Verify ownership
    const student = await verifyOwnership(req, Student, id);

    // Step 2: Store info for audit log
    const studentInfo = student.toObject();

    // Step 3: Soft delete (recommended for audit)
    const deletedStudent = await Student.findByIdAndUpdate(
      id,
      { $set: { deletedAt: new Date() } },
      { new: true }
    );

    // Alternative: Hard delete (if needed)
    // await Student.findByIdAndDelete(id);

    // 📝 Create audit log
    await AuditLog.logAction({
      companyId: req.companyId,
      userId: req.userId,
      userName: req.user.name,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: "delete",
      resource: "student",
      resourceId: id,
      resourceName: studentInfo.fullName,
      changes: {
        before: studentInfo,
        after: null,
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.json({
      success: true,
      message: "Student deleted successfully",
    });
  } catch (error) {
    if (error.message.includes("not found")) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to delete student",
      error: error.message,
    });
  }
};

// ============================================
// POST: Assign counselor to student
// ============================================
exports.assignCounselor = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { counselorId } = req.body;

    if (!counselorId) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        error: "counselorId is required",
      });
    }

    // Verify student ownership
    const student = await verifyOwnership(req, Student, studentId);

    // Verify counselor belongs to same company
    const User = require("../models/user.model");
    const counselor = await User.findOne({
      _id: counselorId,
      companyId: req.companyId, // ⭐ ENSURE SAME COMPANY
    });

    if (!counselor) {
      return res.status(404).json({
        success: false,
        message: "Counselor not found",
        error: "Counselor must belong to your company",
      });
    }

    // Before data
    const beforeData = student.toObject();

    // Update assignment
    student.assignedCounselor = counselorId;
    student.assignedCounselorName = counselor.name;
    await student.save();

    // 📝 Create audit log
    await AuditLog.logAction({
      companyId: req.companyId,
      userId: req.userId,
      userName: req.user.name,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: "update",
      resource: "student",
      resourceId: studentId,
      resourceName: student.fullName,
      changes: {
        before: { assignedCounselor: beforeData.assignedCounselor },
        after: { assignedCounselor: counselorId },
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.json({
      success: true,
      message: "Counselor assigned successfully",
      data: student,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to assign counselor",
      error: error.message,
    });
  }
};

// ============================================
// POST: Add student note/communication
// ============================================
exports.addStudentNote = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { message, type = "note" } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        error: "message is required",
      });
    }

    // Verify ownership
    const student = await verifyOwnership(req, Student, studentId);

    // Add communication
    await student.addCommunication(req.userId, req.user.name, message, type);

    // 📝 Audit log
    await AuditLog.logAction({
      companyId: req.companyId,
      userId: req.userId,
      userName: req.user.name,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: "update",
      resource: "student",
      resourceId: studentId,
      resourceName: student.fullName,
      changes: {
        before: null,
        after: { communicationType: type, message },
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.json({
      success: true,
      message: "Note added successfully",
      data: student,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to add note",
      error: error.message,
    });
  }
};

// ============================================
// GET: Students assigned to counselor (me)
// ============================================
exports.getMyStudents = async (req, res) => {
  try {
    // For counselors: only their assigned students
    if (req.user.role === "counselor") {
      const filter = getTenantFilter(req);
      filter.assignedCounselor = req.userId;

      const students = await Student.find(filter)
        .sort({ createdAt: -1 })
        .select("-communicationHistory.createdBy")
        .lean();

      return res.json({
        success: true,
        message: "Your assigned students",
        data: students,
      });
    }

    // Should not reach here if authorization middleware is correct
    res.status(403).json({
      success: false,
      message: "Unauthorized",
      error: "This endpoint is for counselors only",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve students",
      error: error.message,
    });
  }
};

// ============================================
// GET: Company dashboard statistics
// ============================================
exports.getStudentStats = async (req, res) => {
  try {
    const filter = getTenantFilter(req);

    const [total, byStatus, recentlyAdded] = await Promise.all([
      Student.countDocuments(filter),
      Student.aggregate([
        { $match: filter },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Student.find(filter)
        .sort({ createdAt: -1 })
        .limit(5)
        .select("fullName email status createdAt")
        .lean(),
    ]);

    res.json({
      success: true,
      message: "Student statistics",
      data: {
        totalStudents: total,
        byStatus: byStatus.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        recentlyAdded,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve statistics",
      error: error.message,
    });
  }
};

module.exports = exports;

const express = require("express");
const router = express.Router();
const studentController = require("../controllers/student.controller");
const { extractTenant } = require("../middleware/tenant");
const { authorize, checkPermission } = require("../middleware/authorize");

// ==================== APPLY MIDDLEWARE TO ALL ROUTES ====================
// CRITICAL: extractTenant must come first to populate req.companyId
router.use(extractTenant);

// ==================== ADMIN/MANAGER ONLY ROUTES ====================
// POST /api/students - Create new student
router.post(
  "/",
  authorize(["admin", "manager", "super_admin"]),
  checkPermission("students", "create"),
  studentController.createStudent
);

// PUT /api/students/:id/assign-counselor - Assign counselor
router.put(
  "/:id/assign-counselor",
  authorize(["admin", "super_admin"]),
  checkPermission("students", "assign"),
  studentController.assignCounselor
);

// DELETE /api/students/:id - Delete student
router.delete(
  "/:id",
  authorize(["admin", "super_admin"]),
  checkPermission("students", "delete"),
  studentController.deleteStudent
);

// ==================== ADMIN/MANAGER/COUNSELOR ROUTES ====================
// GET /api/students - Get all students
// Admin/Manager: see all students
// Counselor: see only assigned students
router.get("/", authorize(["admin", "manager", "counselor", "super_admin"]), studentController.getAllStudents);

// GET /api/students/:id - Get single student
router.get(
  "/:id",
  authorize(["admin", "manager", "counselor", "super_admin"]),
  studentController.getStudentById
);

// PUT /api/students/:id - Update student
router.put(
  "/:id",
  authorize(["admin", "manager", "counselor", "super_admin"]),
  checkPermission("students", "update"),
  studentController.updateStudent
);

// ==================== COUNSELOR & ADMIN ROUTES ====================
// POST /api/students/:id/notes - Add note to student
router.post(
  "/:id/notes",
  authorize(["admin", "manager", "counselor", "super_admin"]),
  studentController.addStudentNote
);

// ==================== DASHBOARD STATS ====================
// GET /api/students/stats/all - Get student statistics
router.get(
  "/stats/all",
  authorize(["admin", "manager", "super_admin"]),
  studentController.getStudentStats
);

module.exports = router;


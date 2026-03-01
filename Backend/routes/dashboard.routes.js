const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboard.controller");
const { protect, restrict } = require("../middleware/auth.middleware");

// all dashboard routes must be authenticated
router.use(protect);
// only admins can access (using lowercase)
router.use(restrict("admin"));

// GET /api/dashboard/stats
router.get("/stats", dashboardController.getDashboardStats);

module.exports = router;

const express = require("express");
const router = express.Router();
const { protect, restrict } = require("../middleware/AuthMiddleware");

// Placeholder: Branch management routes (not yet mounted in server.js)
// TODO: Add branch controller and mount with app.use("/api/branches", branchRoutes)

router.use(protect);

// GET /api/branches - list all branches for the company
router.get("/", restrict("admin", "manager"), (req, res) => {
    res.status(200).json({
        success: true,
        message: "Branch listing not yet implemented",
        data: [],
    });
});

module.exports = router;

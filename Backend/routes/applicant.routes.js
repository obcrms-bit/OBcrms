const express = require("express");
const router = express.Router();
const applicantController = require("../controllers/applicant.controller");
const { protect, restrict } = require("../middleware/AuthMiddleware");

router.use(protect);

router.get("/", restrict("admin", "manager", "counselor"), applicantController.getApplications);
router.post("/", restrict("admin", "manager", "counselor"), applicantController.createApplication);
router.patch("/:id/status", restrict("admin", "manager", "counselor"), applicantController.updateApplicationStatus);

module.exports = router;

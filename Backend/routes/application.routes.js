const express = require("express");
const router = express.Router();
const applicationController = require("../controllers/application.controller");
const { protect, restrict } = require("../middleware/auth.middleware");

// protect all routes - user must be logged in
router.use(protect);

// CREATE Application
router.post("/", applicationController.createApplication);

// GET All Applications
router.get("/", applicationController.getAllApplications);

// GET Application by ID
router.get("/:id", applicationController.getApplicationById);

// UPDATE Application
router.put("/:id", applicationController.updateApplication);

// DELETE Application
router.delete("/:id", applicationController.deleteApplication);

module.exports = router;

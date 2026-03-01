const express = require("express");
const router = express.Router();
const applicationController = require("../controllers/application.controller");
const { extractTenant } = require("../middleware/tenant");

// protect all routes - user must be logged in and tenant context populated
router.use(extractTenant);

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

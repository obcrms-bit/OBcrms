const express = require("express");
const router = express.Router();
const leadController = require("../controllers/lead.controller");
const { protect, restrict } = require("../middleware/AuthMiddleware");

router.use(protect);

router.post("/", restrict("admin", "manager", "sales"), leadController.createLead);
router.get("/", restrict("admin", "manager", "sales", "counselor"), leadController.getLeads);
router.put("/:id", restrict("admin", "manager", "sales"), leadController.updateLead);
router.delete("/:id", restrict("admin", "manager"), leadController.deleteLead);
router.patch("/:id/status", restrict("admin", "manager", "sales"), leadController.updateLeadStatus);

module.exports = router;

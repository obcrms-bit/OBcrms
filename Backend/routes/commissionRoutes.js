const express = require("express");
const router = express.Router();
const Commission = require("../models/Commission");
const { sendSuccess, sendError } = require("../utils/responseHandler");
const { extractTenant } = require("../middleware/tenant");

// Apply multi-tenancy middleware
router.use(extractTenant);

// CREATE Commission
router.post("/", async (req, res) => {
  try {
    const { agentId, leadId, studentId, amount, notes } = req.body;

    if (!agentId || !amount) {
      return sendError(res, 400, "Agent ID and amount are required");
    }

    const commission = new Commission({
      companyId: req.companyId,
      agentId,
      leadId,
      studentId,
      amount,
      notes,
    });
    await commission.save();
    sendSuccess(res, 201, "Commission created successfully", commission);
  } catch (error) {
    sendError(res, 400, "Failed to create commission", error.message);
  }
});

// GET All Commissions
router.get("/", async (req, res) => {
  try {
    const commissions = await Commission.find({ companyId: req.companyId })
      .populate("leadId")
      .populate("studentId");
    sendSuccess(res, 200, "Commissions retrieved successfully", commissions);
  } catch (error) {
    sendError(res, 500, "Failed to retrieve commissions", error.message);
  }
});

// GET Commission by ID
router.get("/:id", async (req, res) => {
  try {
    const commission = await Commission.findOne({ _id: req.params.id, companyId: req.companyId })
      .populate("leadId")
      .populate("studentId");
    if (!commission) {
      return sendError(res, 404, "Commission not found");
    }
    sendSuccess(res, 200, "Commission retrieved successfully", commission);
  } catch (error) {
    sendError(res, 500, "Failed to retrieve commission", error.message);
  }
});

// UPDATE Commission
router.put("/:id", async (req, res) => {
  try {
    const commission = await Commission.findOneAndUpdate(
      { _id: req.params.id, companyId: req.companyId },
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    )
      .populate("leadId")
      .populate("studentId");
    if (!commission) {
      return sendError(res, 404, "Commission not found");
    }
    sendSuccess(res, 200, "Commission updated successfully", commission);
  } catch (error) {
    sendError(res, 400, "Failed to update commission", error.message);
  }
});

// DELETE Commission
router.delete("/:id", async (req, res) => {
  try {
    const commission = await Commission.findOneAndDelete({ _id: req.params.id, companyId: req.companyId });
    if (!commission) {
      return sendError(res, 404, "Commission not found");
    }
    sendSuccess(res, 200, "Commission deleted successfully", commission);
  } catch (error) {
    sendError(res, 500, "Failed to delete commission", error.message);
  }
});

module.exports = router;

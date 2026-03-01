const express = require("express");
const router = express.Router();
const Lead = require("../models/Lead");
const { sendSuccess, sendError } = require("../utils/responseHandler");

// CREATE Lead
router.post("/", async (req, res) => {
  try {
    const { name, email, phone, source, interestedCourse } = req.body;

    if (!name || !email) {
      return sendError(res, 400, "Name and email are required");
    }

    const lead = new Lead({ name, email, phone, source, interestedCourse });
    await lead.save();
    sendSuccess(res, 201, "Lead created successfully", lead);
  } catch (error) {
    if (error.code === 11000) {
      return sendError(res, 409, "Email already exists", error.message);
    }
    sendError(res, 400, "Failed to create lead", error.message);
  }
});

// GET All Leads
router.get("/", async (req, res) => {
  try {
    const leads = await Lead.find();
    sendSuccess(res, 200, "Leads retrieved successfully", leads);
  } catch (error) {
    sendError(res, 500, "Failed to retrieve leads", error.message);
  }
});

// GET Lead by ID
router.get("/:id", async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return sendError(res, 404, "Lead not found");
    }
    sendSuccess(res, 200, "Lead retrieved successfully", lead);
  } catch (error) {
    sendError(res, 500, "Failed to retrieve lead", error.message);
  }
});

// UPDATE Lead
router.put("/:id", async (req, res) => {
  try {
    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
    if (!lead) {
      return sendError(res, 404, "Lead not found");
    }
    sendSuccess(res, 200, "Lead updated successfully", lead);
  } catch (error) {
    sendError(res, 400, "Failed to update lead", error.message);
  }
});

// DELETE Lead
router.delete("/:id", async (req, res) => {
  try {
    const lead = await Lead.findByIdAndDelete(req.params.id);
    if (!lead) {
      return sendError(res, 404, "Lead not found");
    }
    sendSuccess(res, 200, "Lead deleted successfully", lead);
  } catch (error) {
    sendError(res, 500, "Failed to delete lead", error.message);
  }
});

module.exports = router;

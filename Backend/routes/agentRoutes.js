const express = require("express");
const router = express.Router();
const Agent = require("../models/Agent");
const { sendSuccess, sendError } = require("../utils/responseHandler");
const { extractTenant } = require("../middleware/tenant");

router.use(extractTenant);

router.post("/", async (req, res) => {
    try {
        const { name, email, phone, commissionRate } = req.body;
        if (!name) return sendError(res, 400, "Agent name is required");

        const agent = new Agent({ companyId: req.companyId, name, email, phone, commissionRate });
        await agent.save();
        sendSuccess(res, 201, "Agent created successfully", agent);
    } catch (error) {
        sendError(res, 400, "Failed to create agent", error.message);
    }
});

router.get("/", async (req, res) => {
    try {
        const agents = await Agent.find({ companyId: req.companyId });
        sendSuccess(res, 200, "Agents retrieved successfully", agents);
    } catch (error) {
        sendError(res, 500, "Failed to retrieve agents", error.message);
    }
});

module.exports = router;

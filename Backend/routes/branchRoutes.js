const express = require("express");
const router = express.Router();
const Branch = require("../models/Branch");
const { sendSuccess, sendError } = require("../utils/responseHandler");
const { extractTenant } = require("../middleware/tenant");

router.use(extractTenant);

router.post("/", async (req, res) => {
    try {
        const { name, location, contactNumber } = req.body;
        if (!name) return sendError(res, 400, "Branch name is required");

        const branch = new Branch({ companyId: req.companyId, name, location, contactNumber });
        await branch.save();
        sendSuccess(res, 201, "Branch created successfully", branch);
    } catch (error) {
        sendError(res, 400, "Failed to create branch", error.message);
    }
});

router.get("/", async (req, res) => {
    try {
        const branches = await Branch.find({ companyId: req.companyId });
        sendSuccess(res, 200, "Branches retrieved successfully", branches);
    } catch (error) {
        sendError(res, 500, "Failed to retrieve branches", error.message);
    }
});

module.exports = router;

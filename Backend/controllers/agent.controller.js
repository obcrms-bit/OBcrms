const Agent = require("../models/Agent");
const AuditLog = require("../models/AuditLog");
const { sendSuccess, sendError } = require("../utils/responseHandler");
const mongoose = require("mongoose");

exports.createAgent = async (req, res) => {
    try {
        const agent = await Agent.create({
            ...req.body,
            companyId: new mongoose.Types.ObjectId(req.companyId),
        });

        await AuditLog.logAction({
            companyId: req.companyId,
            userId: req.user._id,
            userName: req.user.name,
            userRole: req.user.role,
            action: "create",
            resource: "agent",
            resourceId: agent._id,
            resourceName: agent.name,
        });

        return sendSuccess(res, 201, "Agent created successfully", agent);
    } catch (error) {
        return sendError(res, 400, "Failed to create agent", error.message);
    }
};

exports.getAgents = async (req, res) => {
    try {
        const companyObjectId = new mongoose.Types.ObjectId(req.companyId);
        const agents = await Agent.find({ companyId: companyObjectId }).sort({ name: 1 });
        return sendSuccess(res, 200, "Agents retrieved successfully", agents);
    } catch (error) {
        return sendError(res, 500, "Failed to fetch agents", error.message);
    }
};

exports.updateAgent = async (req, res) => {
    try {
        const agent = await Agent.findOneAndUpdate(
            { _id: req.params.id, companyId: new mongoose.Types.ObjectId(req.companyId) },
            { $set: req.body },
            { new: true, runValidators: true }
        );

        if (!agent) return sendError(res, 404, "Agent not found");

        await AuditLog.logAction({
            companyId: req.companyId,
            userId: req.user._id,
            userName: req.user.name,
            userRole: req.user.role,
            action: "update",
            resource: "agent",
            resourceId: agent._id,
            resourceName: agent.name,
        });

        return sendSuccess(res, 200, "Agent updated successfully", agent);
    } catch (error) {
        return sendError(res, 400, "Failed to update agent", error.message);
    }
};

exports.deleteAgent = async (req, res) => {
    try {
        const agent = await Agent.findOneAndDelete({
            _id: req.params.id,
            companyId: new mongoose.Types.ObjectId(req.companyId)
        });

        if (!agent) return sendError(res, 404, "Agent not found");

        await AuditLog.logAction({
            companyId: req.companyId,
            userId: req.user._id,
            userName: req.user.name,
            userRole: req.user.role,
            action: "delete",
            resource: "agent",
            resourceId: agent._id,
            resourceName: agent.name,
        });

        return sendSuccess(res, 200, "Agent deleted successfully");
    } catch (error) {
        return sendError(res, 400, "Failed to delete agent", error.message);
    }
};

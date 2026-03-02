const Lead = require("../models/Lead");
const Student = require("../models/Student");
const AuditLog = require("../models/AuditLog");
const { sendSuccess, sendError } = require("../utils/responseHandler");
const { isValidTransition } = require("../constants/workflow");
const mongoose = require("mongoose");

exports.createLead = async (req, res) => {
    try {
        const lead = await Lead.create({
            ...req.body,
            companyId: new mongoose.Types.ObjectId(req.companyId),
            status: "new",
        });

        await AuditLog.logAction({
            companyId: req.companyId,
            userId: req.user._id,
            userName: req.user.name,
            userRole: req.user.role,
            action: "create",
            resource: "lead",
            resourceId: lead._id,
            resourceName: lead.name,
        });

        return sendSuccess(res, 201, "Lead created successfully", lead);
    } catch (error) {
        return sendError(res, 400, "Failed to create lead", error.message);
    }
};

exports.getLeads = async (req, res) => {
    try {
        const { search = "" } = req.query;
        const companyObjectId = new mongoose.Types.ObjectId(req.companyId);
        const query = { companyId: companyObjectId, deletedAt: null };

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
                { phone: { $regex: search, $options: "i" } },
            ];
        }

        const leads = await Lead.find(query).sort({ createdAt: -1 });
        return sendSuccess(res, 200, "Leads retrieved successfully", leads);
    } catch (error) {
        return sendError(res, 500, "Failed to fetch leads", error.message);
    }
};

exports.updateLead = async (req, res) => {
    try {
        const lead = await Lead.findOneAndUpdate(
            { _id: req.params.id, companyId: new mongoose.Types.ObjectId(req.companyId) },
            { $set: req.body },
            { new: true, runValidators: true }
        );

        if (!lead) return sendError(res, 404, "Lead not found");

        await AuditLog.logAction({
            companyId: req.companyId,
            userId: req.user._id,
            userName: req.user.name,
            userRole: req.user.role,
            action: "update",
            resource: "lead",
            resourceId: lead._id,
            resourceName: lead.name,
            changes: { after: req.body },
        });

        return sendSuccess(res, 200, "Lead updated successfully", lead);
    } catch (error) {
        return sendError(res, 400, "Failed to update lead", error.message);
    }
};

exports.deleteLead = async (req, res) => {
    try {
        const lead = await Lead.findOneAndUpdate(
            { _id: req.params.id, companyId: new mongoose.Types.ObjectId(req.companyId) },
            { deletedAt: new Date() },
            { new: true }
        );

        if (!lead) return sendError(res, 404, "Lead not found");

        await AuditLog.logAction({
            companyId: req.companyId,
            userId: req.user._id,
            userName: req.user.name,
            userRole: req.user.role,
            action: "delete",
            resource: "lead",
            resourceId: lead._id,
            resourceName: lead.name,
        });

        return sendSuccess(res, 200, "Lead deleted successfully (soft delete)");
    } catch (error) {
        return sendError(res, 400, "Failed to delete lead", error.message);
    }
};

exports.updateLeadStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const companyObjectId = new mongoose.Types.ObjectId(req.companyId);

        const lead = await Lead.findOne({ _id: id, companyId: companyObjectId });
        if (!lead) return sendError(res, 404, "Lead not found");

        if (!isValidTransition("LEAD", lead.status, status)) {
            return sendError(res, 400, `Invalid status transition from ${lead.status} to ${status}`);
        }

        const oldStatus = lead.status;
        lead.status = status;
        await lead.save();

        // If status is "converted", create a student
        if (status === "converted") {
            const studentExists = await Student.findOne({
                leadId: lead._id,
                companyId: req.companyId
            });
            if (!studentExists) {
                const student = await Student.create({
                    companyId: req.companyId,
                    leadId: lead._id,
                    fullName: lead.name,
                    email: lead.email,
                    phone: lead.phone,
                    status: "prospect",
                });

                await AuditLog.logAction({
                    companyId: req.companyId,
                    userId: req.user._id,
                    userName: req.user.name,
                    userRole: req.user.role,
                    action: "create",
                    resource: "student",
                    resourceId: student._id,
                    resourceName: student.fullName,
                });
            }
        }

        await AuditLog.logAction({
            companyId: req.companyId,
            userId: req.user._id,
            userName: req.user.name,
            userRole: req.user.role,
            action: "update",
            resource: "lead",
            resourceId: lead._id,
            resourceName: lead.name,
            changes: { before: { status: oldStatus }, after: { status } },
        });

        return sendSuccess(res, 200, "Lead status updated", lead);
    } catch (error) {
        return sendError(res, 400, "Failed to update lead status", error.message);
    }
};

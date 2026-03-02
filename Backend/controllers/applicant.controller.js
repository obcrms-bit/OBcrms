const Applicant = require("../models/Applicant");
const Student = require("../models/Student");
const AuditLog = require("../models/AuditLog");
const { sendSuccess, sendError } = require("../utils/responseHandler");
const { isValidTransition } = require("../constants/workflow");

exports.createApplication = async (req, res) => {
    try {
        const { studentId, universityName, country, courseName, intakeMonth, intakeYear } = req.body;

        const student = await Student.findOne({ _id: studentId, companyId: req.companyId });
        if (!student) return sendError(res, 404, "Student not found");

        const application = await Applicant.create({
            companyId: req.companyId,
            studentId,
            universityName,
            country,
            courseName,
            intake: { month: intakeMonth, year: intakeYear },
            status: "draft",
        });

        await AuditLog.logAction({
            companyId: req.companyId,
            userId: req.user._id,
            userName: req.user.name,
            userRole: req.user.role,
            action: "create",
            resource: "application",
            resourceId: application._id,
            resourceName: `${student.fullName} at ${universityName}`,
        });

        return sendSuccess(res, 201, "Application created successfully", application);
    } catch (error) {
        return sendError(res, 400, "Failed to create application", error.message);
    }
};

exports.updateApplicationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const application = await Applicant.findOne({ _id: id, companyId: req.companyId });
        if (!application) return sendError(res, 404, "Application not found");

        if (!isValidTransition("APPLICANT", application.status, status)) {
            return sendError(res, 400, `Invalid status transition from ${application.status} to ${status}`);
        }

        const oldStatus = application.status;
        application.status = status;
        await application.save();

        await AuditLog.logAction({
            companyId: req.companyId,
            userId: req.user._id,
            userName: req.user.name,
            userRole: req.user.role,
            action: "update",
            resource: "application",
            resourceId: application._id,
            resourceName: application.universityName,
            changes: { before: { status: oldStatus }, after: { status } },
        });

        return sendSuccess(res, 200, "Application status updated", application);
    } catch (error) {
        return sendError(res, 400, "Failed to update application status", error.message);
    }
};

exports.getApplications = async (req, res) => {
    try {
        const applications = await Applicant.find({ companyId: req.companyId })
            .populate("studentId")
            .sort({ createdAt: -1 });
        return sendSuccess(res, 200, "Applications retrieved successfully", applications);
    } catch (error) {
        return sendError(res, 500, "Failed to fetch applications", error.message);
    }
};


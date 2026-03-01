const Student = require("../models/student.model");
const Application = require("../models/application.model");
const { sendSuccess, sendError } = require("../utils/responseHandler");

// This controller provides aggregated analytics for the admin dashboard.
// All queries use MongoDB aggregation framework and async/await.

const mongoose = require("mongoose");

exports.getDashboardStats = async (req, res) => {
  try {
    const companyId = req.companyId;
    if (!companyId) return sendError(res, 401, "Tenant context missing");

    // total students and applications
    const [totalStudents, totalApplications, visaApprovedCount] = await Promise.all([
      Student.countDocuments({ companyId }),
      Application.countDocuments({ companyId }),
      Application.countDocuments({ companyId, status: "Visa Approved" }),
    ]);

    // Convert string companyId to ObjectId for aggregation
    const companyObjectId = new mongoose.Types.ObjectId(companyId);

    // applications grouped by status
    const applicationsByStatusAgg = await Application.aggregate([
      { $match: { companyId: companyObjectId } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const applicationsByStatus = applicationsByStatusAgg.reduce((acc, { _id, count }) => {
      acc[_id] = count;
      return acc;
    }, {});

    // students grouped by countryInterested (may be undefined if blank)
    const studentsByCountryAgg = await Student.aggregate([
      { $match: { companyId: companyObjectId } },
      { $group: { _id: "$countryInterested", count: { $sum: 1 } } },
    ]);
    const studentsByCountry = studentsByCountryAgg.reduce((acc, { _id, count }) => {
      acc[_id || "Unknown"] = count;
      return acc;
    }, {});

    const data = {
      totalStudents,
      totalApplications,
      visaApprovedCount,
      applicationsByStatus,
      studentsByCountry,
    };

    return sendSuccess(res, 200, "Dashboard stats retrieved", data);
  } catch (error) {
    return sendError(res, 500, "Failed to fetch dashboard stats", error.message);
  }
};
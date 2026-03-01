const Student = require("../models/student.model");
const Application = require("../models/application.model");
const { sendSuccess, sendError } = require("../utils/responseHandler");

// This controller provides aggregated analytics for the admin dashboard.
// All queries use MongoDB aggregation framework and async/await.

exports.getDashboardStats = async (req, res) => {
  try {
    // total students and applications
    const [totalStudents, totalApplications, visaApprovedCount] = await Promise.all([
      Student.countDocuments(),
      Application.countDocuments(),
      Application.countDocuments({ status: "Visa Approved" }),
    ]);

    // applications grouped by status
    const applicationsByStatusAgg = await Application.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const applicationsByStatus = applicationsByStatusAgg.reduce((acc, { _id, count }) => {
      acc[_id] = count;
      return acc;
    }, {});

    // students grouped by countryInterested (may be undefined if blank)
    const studentsByCountryAgg = await Student.aggregate([
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
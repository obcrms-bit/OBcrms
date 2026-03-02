const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { sendError } = require("../utils/responseHandler");

// JWT_SECRET is validated at server startup (server.js). Safe to use directly.
const JWT_SECRET = process.env.JWT_SECRET;

// verify token and attach user to req
exports.protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return sendError(res, 401, "Authorization token missing");
    }
    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    // decoded contains { userId, companyId, role, ... }
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return sendError(res, 401, "User not found");
    }

    // Multi-tenancy check
    if (user.companyId.toString() !== decoded.companyId) {
      return sendError(res, 403, "Access denied: tenant mismatch");
    }

    req.user = user;
    req.companyId = user.companyId.toString();
    next();
  } catch (error) {
    sendError(res, 401, "Invalid or expired token", error.message);
  }
};

// restrict to specific roles (case-insensitive)
exports.restrict = (...roles) => {
  return (req, res, next) => {
    const userRole = req.user?.role?.toLowerCase();
    const allowedRoles = roles.map(r => r.toLowerCase());
    if (!req.user || !allowedRoles.includes(userRole)) {
      return sendError(res, 403, "Forbidden: insufficient role");
    }
    next();
  };
};

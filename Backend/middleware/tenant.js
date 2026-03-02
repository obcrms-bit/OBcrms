const jwt = require("jsonwebtoken");
const Company = require("../models/Company");

/**
 * Tenant Extraction Middleware
 * 
 * CRITICAL: This middleware is the core of multi-tenant data isolation
 * 
 * Flow:
 * 1. Extract JWT token from Authorization header
 * 2. Verify JWT signature
 * 3. Extract companyId from JWT payload
 * 4. Verify company exists and is active
 * 5. Attach companyId to request object
 * 6. All subsequent database queries will filter by companyId
 * 
 * Usage: Apply this middleware to ALL protected routes
 */

const extractTenant = async (req, res, next) => {
  try {
    // Step 1: Extract token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
        error: "Authorization header missing or invalid format",
      });
    }

    const token = authHeader.split(" ")[1];

    // Step 2: Verify JWT with signature
    const JWT_SECRET = process.env.JWT_SECRET;
    const decoded = jwt.verify(token, JWT_SECRET);

    if (!decoded.userId || !decoded.companyId) {
      return res.status(401).json({
        success: false,
        message: "Invalid token structure",
        error: "Token missing userId or companyId",
      });
    }

    // Step 3 & 4: Verify company exists and is active
    const company = await Company.findById(decoded.companyId);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
        error: "Referenced company does not exist",
      });
    }

    if (!company.isActive) {
      return res.status(403).json({
        success: false,
        message: "Company access disabled",
        error: "This company has been deactivated or suspended",
      });
    }

    // Step 5: Attach to request object
    req.user = decoded; // Full JWT payload
    req.companyId = decoded.companyId; // Shortcut for easy access
    req.userId = decoded.userId;
    req.company = company;

    // Log tenant assignment for debugging
    console.log(
      `[Tenant] User ${decoded.userId} accessing company ${decoded.companyId}`
    );

    next();
  } catch (error) {
    // Handle different JWT errors
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
        error: "Token signature verification failed",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired",
        error: "Please login again",
      });
    }

    // Generic error
    return res.status(401).json({
      success: false,
      message: "Authentication failed",
      error: error.message,
    });
  }
};

/**
 * Helper function to get tenant filter for queries
 * 
 * Usage in controllers:
 * const tenantFilter = getTenantFilter(req);
 * const students = await Student.find(tenantFilter);
 */
const getTenantFilter = (req) => {
  if (!req.companyId) {
    throw new Error("Tenant context not available. Make sure extractTenant middleware is applied.");
  }
  return { companyId: req.companyId };
};

/**
 * Verify ownership of resource by checking companyId
 */
const verifyResourceOwnership = async (Model, resourceId, req) => {
  const resource = await Model.findById(resourceId);

  if (!resource) {
    throw new Error("Resource not found");
  }

  if (resource.companyId.toString() !== req.companyId.toString()) {
    throw new Error("Unauthorized: Resource belongs to different company");
  }

  return resource;
};

module.exports = {
  extractTenant,
  getTenantFilter,
  verifyResourceOwnership,
};

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const Company = require("../models/Company");
const { sendSuccess, sendError } = require("../utils/responseHandler");

const JWT_SECRET = process.env.JWT_SECRET || "replace_this_with_a_secure_secret";
const TOKEN_EXPIRES = "7d";

// ==================== COMPANY REGISTRATION ====================
// Called when a new company onboards - creates company & first admin
exports.registerCompany = async (req, res) => {
  console.log("[registerCompany] Called with body:", req.body);
  try {
    const { companyName, email, password, name, country } = req.body;

    if (!companyName || !email || !password || !name) {
      return sendError(res, 400, "companyName, email, password, and name are required");
    }

    console.log("[registerCompany] Validation passed, checking company existence...");

    // Check if company already exists
    const existingCompany = await Company.findOne({ email });
    if (existingCompany) {
      return sendError(res, 409, "Company with this email already exists");
    }

    console.log("[registerCompany] Company not found, checking user email...");

    // Check if user email is globally unique
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendError(res, 409, "Email already in use");
    }

    // Generate a unique companyId
    const companyIdStr = "COMP_" + Math.random().toString(36).substring(2, 15).toUpperCase();

    console.log("[registerCompany] Creating new company...");

    // Create new company normally now that owner is optional
    const companyDoc = {
      companyId: companyIdStr,
      name: companyName,
      email,
      country: country || "US",
      subscription: {
        plan: "free",
        status: "trial",
        features: ["students_crm"],
      },
      limits: {
        maxUsers: 5,
        maxStudents: 100,
        maxCounselors: 3,
      },
      isActive: true,
      createdAt: new Date(),
    };

    const companyModel = new Company(companyDoc);
    console.log("[registerCompany] About to save company...");
    const company = await companyModel.save();
    console.log("[registerCompany] Company saved successfully with ID:", company._id);

    // Hash password & create super_admin user
    console.log("[registerCompany] Creating admin user...");
    // NOTE: Don't hash here - let the User pre-save hook handle it
    const user = new User({
      companyId: company._id,
      name,
      email,
      password,  // Pre-save hook will hash this
      role: "super_admin",
      isActive: true,
    });

    console.log("[registerCompany] About to save user...");
    await user.save();
    console.log("[registerCompany] User saved successfully");

    console.log("[registerCompany] User created, updating company owner...");

    // Now update company to set the actual owner
    await Company.findByIdAndUpdate(company._id, { owner: user._id });

    console.log("[registerCompany] Generating token...");

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, companyId: company._id, role: user.role },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRES }
    );

    console.log("[registerCompany] SUCCESS");

    sendSuccess(res, 201, "Company registered successfully", {
      token,
      company: { id: company._id, name: company.name },
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error("[registerCompany] ERROR:", error);
    if (error.code === 11000) {
      return sendError(res, 409, "Email already in use", error.message);
    }
    sendError(res, 500, "Failed to register company", error.message);
  }
};

// ==================== USER REGISTRATION (BY ADMIN) ====================
// Called by admin to add users to their company
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, companyId: bodyCompanyId } = req.body;
    const companyId = req.companyId || bodyCompanyId; // Support both middleware and direct body input

    if (!name || !email || !password) {
      return sendError(res, 400, "name, email, and password are required");
    }

    if (!companyId) {
      return sendError(res, 401, "Company context missing - unauthorized");
    }

    // Verify company exists
    const company = await Company.findById(companyId);
    if (!company) {
      return sendError(res, 404, "Company not found");
    }

    // Check if user email is unique within company
    const existingUser = await User.findOne({ companyId, email });
    if (existingUser) {
      return sendError(res, 409, "User with this email already exists in your company");
    }

    // Normalize role to lowercase
    const normalizedRole = role ? role.toLowerCase() : "counselor";

    // Validate role (only admin/manager/counselor, not super_admin)
    if (!["admin", "manager", "counselor"].includes(normalizedRole)) {
      return sendError(res, 400, "Invalid role. Allowed: admin, manager, counselor");
    }

    // NOTE: Don't hash here - let the User pre-save hook handle it
    const user = new User({
      companyId,
      name,
      email,
      password,  // Pre-save hook will hash this
      role: normalizedRole,
      isActive: true,
    });
    await user.save();

    sendSuccess(res, 201, "User created successfully", {
      id: user._id,
      name,
      email,
      role: normalizedRole,
    });
  } catch (error) {
    if (error.code === 11000) {
      return sendError(res, 409, "Email already in use", error.message);
    }
    sendError(res, 500, "Failed to create user", error.message);
  }
};

// ==================== LOGIN ====================
// Authenticate user & return JWT with companyId
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return sendError(res, 400, "Email and password are required");
    }

    // Find user by email (global, since email can only belong to one company)
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return sendError(res, 401, "Invalid credentials");
    }

    // Verify company is active
    const company = await Company.findById(user.companyId);
    if (!company || !company.isActive) {
      return sendError(res, 401, "Company is inactive");
    }

    // Check if user is active
    if (!user.isActive) {
      return sendError(res, 401, "User account is inactive");
    }

    // Compare passwords
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return sendError(res, 401, "Invalid credentials");
    }

    // Generate JWT with userId, companyId, role
    const token = jwt.sign(
      {
        userId: user._id,
        companyId: user.companyId,
        role: user.role,
        email: user.email,
      },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRES }
    );

    sendSuccess(res, 200, "Login successful", {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
      },
    });
  } catch (error) {
    sendError(res, 500, "Login failed", error.message);
  }
};

// ==================== LOGOUT ====================
exports.logout = async (req, res) => {
  try {
    // JWT is stateless, logout just happens on client
    // In future, can blacklist token or invalidate sessions
    sendSuccess(res, 200, "Logout successful");
  } catch (error) {
    sendError(res, 500, "Logout failed", error.message);
  }
};


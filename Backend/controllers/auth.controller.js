const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Company = require('../models/Company');
const Branch = require('../models/Branch');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const {
  serializeAuthUser,
  serializeCompactUser,
} = require('../src/modules/auth/auth.presenter');
const {
  ensureCompanySaaSSetup,
  getDefaultRoleKey,
} = require('../services/tenantProvisioning.service');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set!');
  process.exit(1);
}
const TOKEN_EXPIRES = '7d';

// ==================== COMPANY REGISTRATION ====================
// Called when a new company onboards - creates company & first admin
exports.registerCompany = async (req, res) => {
  console.log('[registerCompany] Called with body:', req.body);
  try {
    const { companyName, email, password, name, country } = req.body;

    if (!companyName || !email || !password || !name) {
      return sendError(res, 400, 'companyName, email, password, and name are required');
    }

    console.log('[registerCompany] Validation passed, checking company existence...');

    // Check if company already exists
    const existingCompany = await Company.findOne({ email });
    if (existingCompany) {
      return sendError(res, 409, 'Company with this email already exists');
    }

    console.log('[registerCompany] Company not found, checking user email...');

    // Check if user email is globally unique
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendError(res, 409, 'Email already in use');
    }

    // Generate a unique companyId
    const companyIdStr = 'COMP_' + Math.random().toString(36).substring(2, 15).toUpperCase();

    console.log('[registerCompany] Creating new company...');

    // Create new company normally now that owner is optional
    const companyDoc = {
      companyId: companyIdStr,
      name: companyName,
      email,
      country: country || 'US',
      subscription: {
        plan: 'free',
        status: 'trial',
        features: ['students_crm'],
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
    console.log('[registerCompany] About to save company...');
    const company = await companyModel.save();
    console.log('[registerCompany] Company saved successfully with ID:', company._id);

    await ensureCompanySaaSSetup(company._id);
    const headOfficeBranch = await Branch.findOne({ companyId: company._id, isHeadOffice: true });

    console.log('[registerCompany] Creating admin user...');
    const user = new User({
      companyId: company._id,
      branchId: headOfficeBranch?._id,
      name,
      email,
      password,
      role: 'head_office_admin',
      primaryRoleKey: 'head_office_admin',
      isHeadOffice: true,
      managerEnabled: true,
      isActive: true,
    });

    console.log('[registerCompany] About to save user...');
    await user.save();
    console.log('[registerCompany] User saved successfully');

    console.log('[registerCompany] User created, updating company owner...');

    await Company.findByIdAndUpdate(company._id, {
      owner: user._id,
      headOfficeBranchId: headOfficeBranch?._id,
    });

    console.log('[registerCompany] Generating token...');

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, companyId: company._id, role: user.role },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRES }
    );

    const serializedUser = await serializeAuthUser(user, company);

    console.log('[registerCompany] SUCCESS');

    sendSuccess(res, 201, 'Company registered successfully', {
      token,
      company: { id: company._id, name: company.name },
      user: serializedUser,
    });
  } catch (error) {
    console.error('[registerCompany] ERROR:', error);
    if (error.code === 11000) {
      return sendError(res, 409, 'Email already in use', error.message);
    }
    sendError(res, 500, 'Failed to register company', error.message);
  }
};

// ==================== USER REGISTRATION (BY ADMIN) ====================
// Called by admin to add users to their company
exports.register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      branchId,
      companyId: bodyCompanyId,
      supervisor,
      permissionBundleIds,
      primaryRoleKey,
      isHeadOffice,
      managerEnabled,
    } = req.body;
    const companyId = req.companyId || bodyCompanyId; // Support both middleware and direct body input

    if (!name || !email || !password) {
      return sendError(res, 400, 'name, email, and password are required');
    }

    if (!companyId) {
      return sendError(res, 401, 'Company context missing - unauthorized');
    }

    // Verify company exists
    const company = await Company.findById(companyId);
    if (!company) {
      return sendError(res, 404, 'Company not found');
    }

    // Check if user email is unique within company
    const existingUser = await User.findOne({ companyId, email });
    if (existingUser) {
      return sendError(res, 409, 'User with this email already exists in your company');
    }

    await ensureCompanySaaSSetup(companyId);
    const normalizedRole = role ? role.toLowerCase() : 'frontdesk';
    const resolvedRoleKey = getDefaultRoleKey(primaryRoleKey || normalizedRole);

    const user = new User({
      companyId,
      branchId: branchId || req.user?.branchId || company.headOfficeBranchId,
      name,
      email,
      password,
      role: normalizedRole,
      primaryRoleKey: resolvedRoleKey,
      supervisor: supervisor || undefined,
      reportsTo: supervisor || undefined,
      permissionBundleIds: Array.isArray(permissionBundleIds) ? permissionBundleIds : [],
      isHeadOffice: Boolean(isHeadOffice),
      managerEnabled: Boolean(managerEnabled),
      invitedBy: req.user?._id,
      isActive: true,
    });
    await user.save();

    const serializedUser = await serializeAuthUser(user, company);

    sendSuccess(res, 201, 'User created successfully', {
      user: serializedUser,
    });
  } catch (error) {
    if (error.code === 11000) {
      return sendError(res, 409, 'Email already in use', error.message);
    }
    sendError(res, 500, 'Failed to create user', error.message);
  }
};

// ==================== LOGIN ====================
// Authenticate user & return JWT with companyId
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return sendError(res, 400, 'Email and password are required');
    }

    // Find user by email (global, since email can only belong to one company)
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return sendError(res, 401, 'Invalid credentials');
    }

    // Verify company is active
    const company = await Company.findById(user.companyId);
    if (!company) {
      return sendError(res, 401, 'Company is inactive');
    }

    if (!company.isActive && !['super_admin', 'super_admin_manager'].includes(user.role)) {
      return sendError(res, 401, 'Company is inactive');
    }

    // Check if user is active
    if (!user.isActive) {
      return sendError(res, 401, 'User account is inactive');
    }

    // Compare passwords
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return sendError(res, 401, 'Invalid credentials');
    }

    await ensureCompanySaaSSetup(user.companyId);
    const fullUser = await User.findById(user._id).select('-password');
    const serializedUser = await serializeAuthUser(fullUser, company);

    const token = jwt.sign(
      {
        userId: user._id,
        companyId: user.companyId,
        role: user.role,
        primaryRoleKey: fullUser.primaryRoleKey || user.role,
        email: user.email,
      },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRES }
    );

    sendSuccess(res, 200, 'Login successful', {
      token,
      user: serializedUser,
    });
  } catch (error) {
    sendError(res, 500, 'Login failed', error.message);
  }
};

// ==================== LOGOUT ====================
exports.logout = async (req, res) => {
  try {
    // JWT is stateless, logout just happens on client
    // In future, can blacklist token or invalidate sessions
    sendSuccess(res, 200, 'Logout successful');
  } catch (error) {
    sendError(res, 500, 'Logout failed', error.message);
  }
};

// ==================== GET ME ====================
// Returns the authenticated user's profile
exports.getMe = async (req, res) => {
  try {
    if (!req.user) {
      return sendError(res, 401, 'Authentication required');
    }

    if (!req.user.isActive || !req.company) {
      return sendError(res, 404, 'User not found');
    }

    const serializedUser = await serializeAuthUser(req.user, req.company, {
      branch: req.user.branchId,
      effectiveAccess: req.user.effectiveAccess,
    });
    res.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=60');
    sendSuccess(res, 200, 'User profile retrieved', serializedUser);
  } catch (error) {
    sendError(res, 500, 'Failed to get profile', error.message);
  }
};

// ==================== LIST COMPANY USERS ====================
// Supports assignment dropdowns and internal staff directories
exports.getCompanyUsers = async (req, res) => {
  try {
    const isCompactView = String(req.query.compact || '').toLowerCase() === 'dashboard';
    const query = {
      companyId: req.companyId,
      isActive: true,
    };

    if (req.query.role) {
      query.role = String(req.query.role).toLowerCase();
    }

    if (req.query.branchId) {
      query.branchId = req.query.branchId;
    }

    const users = await User.find(query)
      .select(
        isCompactView
          ? 'name email role primaryRoleKey branchId avatar jobTitle department isOnline lastSeen isHeadOffice managerEnabled countries createdAt'
          : 'name email role primaryRoleKey branchId avatar jobTitle department isOnline lastSeen isHeadOffice managerEnabled countries permissionBundleIds roleId permissions fieldAccessOverrides updatedAt'
      )
      .populate('branchId', 'name code isHeadOffice')
      .sort({ name: 1 })
      .lean();

    if (isCompactView) {
      res.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=60');
      return sendSuccess(res, 200, 'Company users retrieved', {
        users: users.map((user) => serializeCompactUser(user)),
      });
    }

    const enrichedUsers = await Promise.all(
      users.map(async (user) => ({
        ...(await serializeAuthUser(user, null, { branch: user.branchId })),
      }))
    );

    sendSuccess(res, 200, 'Company users retrieved', { users: enrichedUsers });
  } catch (error) {
    sendError(res, 500, 'Failed to get company users', error.message);
  }
};

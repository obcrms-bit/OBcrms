/**
 * Authorization Middleware
 *
 * Implements Role-Based Access Control (RBAC) and permission checks
 *
 * Roles:
 * - super_admin: Can access all companies, manage system
 * - admin: Full access to their company
 * - manager: Can manage counselors and some reports
 * - counselor: Can see assigned students only
 */

/**
 * Check if user has required role
 *
 * Usage:
 * router.get("/companies", authorize(["super_admin"]), handler);
 * router.post("/students", authorize(["admin", "manager"]), handler);
 */
const authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    try {
      // Super admin bypasses all role checks
      if (req.user.role === 'super_admin') {
        return next();
      }

      // Check if user's role is in allowed roles
      if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
          error: `This action requires one of these roles: ${allowedRoles.join(', ')}`,
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Authorization check failed',
        error: error.message,
      });
    }
  };
};

/**
 * Check if user has specific resource permissions
 *
 * Permissions structure:
 * user.permissions = [
 *   { resource: "students", actions: ["view", "create", "edit", "delete"] },
 *   { resource: "reports", actions: ["view", "export"] }
 * ]
 *
 * Usage:
 * router.post("/students", checkPermission("students", "create"), handler);
 * router.delete("/students/:id", checkPermission("students", "delete"), handler);
 */
const checkPermission = (resource, action) => {
  return (req, res, next) => {
    try {
      // Super admin has all permissions
      if (req.user.role === 'super_admin') {
        return next();
      }

      // Find permission for this resource
      const permission = req.user.permissions?.find((p) => p.resource === resource);

      if (!permission) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
          error: `No access to ${resource}`,
        });
      }

      // Check if user has required action
      if (!permission.actions.includes(action)) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
          error: `You can only perform: ${permission.actions.join(', ')} on ${resource}`,
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Permission check failed',
        error: error.message,
      });
    }
  };
};

/**
 * For counselors: Only allow viewing assigned students
 * For others: Allow viewing based on their role
 *
 * Usage in student routes:
 * router.get("/students", checkStudentAccess, studentController.getStudents);
 */
const checkStudentAccess = (req, res, next) => {
  try {
    // Super admin and admin can see all students in their company
    if (['super_admin', 'admin', 'manager'].includes(req.user.role)) {
      return next();
    }

    // Counselors can only see their assigned students
    if (req.user.role === 'counselor') {
      // Store in request so controller knows to filter by assignee
      req.filterByCounselor = req.userId;
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Unauthorized',
      error: "You don't have access to student data",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Access check failed',
      error: error.message,
    });
  }
};

/**
 * Only allow company admins and super admins to manage users
 *
 * Usage:
 * router.post("/users", checkUserManagement, userController.createUser);
 */
const checkUserManagement = (req, res, next) => {
  // Only admin and super admin can manage users
  if (!['admin', 'super_admin'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Unauthorized',
      error: 'Only administrators can manage users',
    });
  }

  next();
};

/**
 * Only allow viewing own profile or users within same company (for admins)
 *
 * Usage:
 * router.get("/users/:userId", checkUserAccess, userController.getUser);
 */
const checkUserAccess = (req, res, next) => {
  const { userId } = req.params;

  // Can always view own profile
  if (userId === req.userId.toString()) {
    return next();
  }

  // Admins can view other users in their company
  if (['admin', 'super_admin'].includes(req.user.role)) {
    return next();
  }

  // Others cannot view other users
  return res.status(403).json({
    success: false,
    message: 'Unauthorized',
    error: 'You can only view your own profile',
  });
};

/**
 * Only super-admins can access global company management
 *
 * Usage:
 * router.get("/admin/companies", checkSuperAdmin, adminController.getCompanies);
 */
const checkSuperAdmin = (req, res, next) => {
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: 'Unauthorized',
      error: 'Only super administrators can access this resource',
    });
  }

  next();
};

/**
 * Role hierarchy helper
 * Returns true if userRole has at least the specified hierarchy level
 *
 * Hierarchy: super_admin > admin > manager > counselor
 */
const hasRoleHierarchy = (userRole, requiredLevel) => {
  const hierarchy = {
    super_admin: 4,
    admin: 3,
    manager: 2,
    counselor: 1,
  };

  return hierarchy[userRole] >= hierarchy[requiredLevel];
};

module.exports = {
  authorize,
  checkPermission,
  checkStudentAccess,
  checkUserManagement,
  checkUserAccess,
  checkSuperAdmin,
  hasRoleHierarchy,
};

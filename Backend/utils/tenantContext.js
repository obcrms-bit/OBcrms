/**
 * Tenant Context Utilities
 * 
 * Helper functions for multi-tenant query building and data access
 */

/**
 * Build base query with tenant isolation
 * 
 * Usage:
 * const students = await Student.find(buildTenantQuery(req));
 */
const buildTenantQuery = (req, additionalFilters = {}) => {
  if (!req.companyId) {
    throw new Error("Tenant context missing. Ensure extractTenant middleware is applied.");
  }

  return {
    companyId: req.companyId,
    ...additionalFilters,
  };
};

/**
 * Safe query builder with automatic tenant filtering
 * Prevents accidental cross-tenant data access
 * 
 * Usage:
 * const query = buildSafeQuery(req, { status: "Active" }, { sort: "email" });
 */
const buildSafeQuery = (
  req,
  filters = {},
  options = {}
) => {
  const baseQuery = buildTenantQuery(req, filters);

  return {
    query: baseQuery,
    options: {
      sort: options.sort || { createdAt: -1 },
      limit: options.limit || 50,
      skip: options.skip || 0,
      select: options.select || null,
      lean: options.lean !== false, // Optimize by default
      ...options,
    },
  };
};

/**
 * Execute safe query with full isolation
 * 
 * Usage:
 * const students = await executeSafeQuery(
 *   req,
 *   Student,
 *   { status: "Active" },
 *   { sort: "-createdAt", limit: 10 }
 * );
 */
const executeSafeQuery = async (
  req,
  Model,
  filters = {},
  options = {}
) => {
  try {
    const { query, options: queryOptions } = buildSafeQuery(req, filters, options);

    let queryBuilder = Model.find(query);

    // Apply options
    if (queryOptions.select) {
      queryBuilder = queryBuilder.select(queryOptions.select);
    }

    if (queryOptions.populate) {
      queryBuilder = queryBuilder.populate(queryOptions.populate);
    }

    queryBuilder = queryBuilder
      .sort(queryOptions.sort)
      .skip(queryOptions.skip)
      .limit(queryOptions.limit);

    if (queryOptions.lean) {
      queryBuilder = queryBuilder.lean();
    }

    return await queryBuilder.exec();
  } catch (error) {
    throw new Error(`Query execution failed: ${error.message}`);
  }
};

/**
 * Count documents with tenant isolation
 * 
 * Usage:
 * const count = await countWithTenant(req, Student, { status: "Active" });
 */
const countWithTenant = async (req, Model, filters = {}) => {
  const query = buildTenantQuery(req, filters);
  return await Model.countDocuments(query);
};

/**
 * Get paginated results with tenant isolation
 * 
 * Returns: { data: [], total: 100, page: 1, pages: 10, limit: 10 }
 */
const getPaginatedResults = async (
  req,
  Model,
  filters = {},
  page = 1,
  limit = 10
) => {
  try {
    const skip = (page - 1) * limit;
    const query = buildTenantQuery(req, filters);

    const [data, total] = await Promise.all([
      Model.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Model.countDocuments(query),
    ]);

    return {
      data,
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
      hasMore: page < Math.ceil(total / limit),
    };
  } catch (error) {
    throw new Error(`Pagination failed: ${error.message}`);
  }
};

/**
 * Search with tenant isolation
 * Requires model to have text indexes
 * 
 * Usage:
 * const results = await searchWithTenant(req, Student, "john", { limit: 10 });
 */
const searchWithTenant = async (
  req,
  Model,
  searchText,
  options = {}
) => {
  try {
    const query = {
      ...buildTenantQuery(req),
      $text: { $search: searchText },
    };

    const results = await Model.find(query)
      .select({ score: { $meta: "textScore" } })
      .sort({ score: { $meta: "textScore" } })
      .limit(options.limit || 20)
      .lean();

    return results;
  } catch (error) {
    throw new Error(`Search failed: ${error.message}`);
  }
};

/**
 * Bulk operations with tenant safety
 * Automatically adds companyId to all operations
 */
const bulkWriteWithTenant = async (
  req,
  Model,
  operations = []
) => {
  // Enhance operations with tenantId safety checks
  const enhancedOps = operations.map((op) => {
    if (op.updateOne) {
      op.updateOne.filter.companyId = req.companyId;
    }
    if (op.deleteOne) {
      op.deleteOne.filter.companyId = req.companyId;
    }
    if (op.insertOne) {
      op.insertOne.document.companyId = req.companyId;
    }
    return op;
  });

  return await Model.bulkWrite(enhancedOps);
};

/**
 * Verify resource ownership before modification
 * Used in update/delete operations
 * 
 * Usage:
 * await verifyOwnership(req, Student, studentId);
 * // If passes, it's safe to update
 */
const verifyOwnership = async (req, Model, resourceId) => {
  if (!resourceId) {
    throw new Error("Resource ID required");
  }

  const resource = await Model.findOne({
    _id: resourceId,
    companyId: req.companyId,
  });

  if (!resource) {
    throw new Error(
      "Resource not found or belongs to different company"
    );
  }

  return resource;
};

/**
 * Apply counselor filter for role-based access
 * 
 * Usage:
 * const filter = applyRoleBasedFilter(req, {});
 * const students = await Student.find(filter);
 */
const applyRoleBasedFilter = (req, baseFilter = {}) => {
  const filter = buildTenantQuery(req, baseFilter);

  // If counselor, only return their assigned students
  if (req.user.role === "counselor") {
    filter.assignedCounselor = req.userId;
  }

  return filter;
};

/**
 * Log access for audit trail
 * Automatically includes company and user info
 */
const createAuditLog = (req, action, resource, resourceId = null, details = {}) => {
  return {
    companyId: req.companyId,
    userId: req.userId,
    userName: req.user.name,
    userEmail: req.user.email,
    userRole: req.user.role,
    action,
    resource,
    resourceId,
    ipAddress: req.ip,
    userAgent: req.get("user-agent"),
    timestamp: new Date(),
    ...details,
  };
};

module.exports = {
  buildTenantQuery,
  buildSafeQuery,
  executeSafeQuery,
  countWithTenant,
  getPaginatedResults,
  searchWithTenant,
  bulkWriteWithTenant,
  verifyOwnership,
  applyRoleBasedFilter,
  createAuditLog,
};

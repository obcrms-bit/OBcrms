# Multi-Tenant Implementation Guide

## 📋 Overview

This guide shows how to integrate the multi-tenant SaaS architecture into your existing Express backend. Follow these steps sequentially to avoid breaking existing functionality.

---

## Phase 1: Database Models (COMPLETED ✅)

Files already created:
- ✅ [Company.js](../Backend/models/Company.js) - New company model with subscription management
- ✅ [user.model.js](../Backend/models/user.model.js) - Updated with companyId, roles, permissions
- ✅ [student.model.js](../Backend/models/student.model.js) - Updated with companyId
- ✅ [AuditLog.js](../Backend/models/AuditLog.js) - New audit logging model

**What changed:**
```javascript
// BEFORE: No company reference
email: { type: String, unique: true }

// AFTER: Company-scoped uniqueness
companyId: { type: ObjectId, required: true, index: true }
email: { type: String }
// With index: { companyId: 1, email: 1 }, { unique: true }
```

---

## Phase 2: Middleware Setup (COMPLETED ✅)

Files created:
- ✅ [tenant.js](../Backend/middleware/tenant.js) - Data isolation
- ✅ [authorize.js](../Backend/middleware/authorize.js) - Role-based access control

### Apply tenant middleware globally:

```javascript
// server.js
const { extractTenant } = require("./middleware/tenant");

// ❌ BEFORE
app.use("/api/students", studentRoutes);

// ✅ AFTER: Add tenant extraction to all protected routes
app.use("/api/students", extractTenant, studentRoutes);
app.use("/api/users", extractTenant, userRoutes);
app.use("/api/leads", extractTenant, leadRoutes);
```

---

## Phase 3: Utility Functions (COMPLETED ✅)

File created:
- ✅ [tenantContext.js](../Backend/utils/tenantContext.js) - Query builders and helpers

### Usage in controllers:

```javascript
// BEFORE: Direct query without isolation
const students = await Student.find({ status: "Active" });

// AFTER: Query with automatic tenant filtering
const { executeSafeQuery } = require("../utils/tenantContext");
const students = await executeSafeQuery(
  req,
  Student,
  { status: "Active" },
  { sort: "-createdAt", limit: 10 }
);
```

---

## Phase 4: Update Existing Controllers

### Example: Updates to Student Controller

```javascript
// controllers/student.controller.js
const { executeSafeQuery, verifyOwnership, getPaginatedResults } = require("../utils/tenantContext");
const { checkPermission } = require("../middleware/authorize");

// Get all students
exports.getStudents = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;

    // ✅ NEW: Paginated query with tenant isolation
    const filters = search 
      ? { fullName: { $regex: search, $options: "i" } }
      : {};

    const results = await getPaginatedResults(
      req,
      Student,
      filters,
      parseInt(page),
      parseInt(limit)
    );

    res.json({
      success: true,
      data: results.data,
      pagination: {
        total: results.total,
        page: results.page,
        pages: results.pages,
        limit: results.limit,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Create student
exports.createStudent = async (req, res) => {
  try {
    // ✅ NEW: Auto-attach companyId
    const studentData = {
      ...req.body,
      companyId: req.companyId, // From extractTenant middleware
    };

    const student = new Student(studentData);
    await student.save();

    res.status(201).json({
      success: true,
      message: "Student created",
      data: student,
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Update student
exports.updateStudent = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ CRITICAL: Verify ownership before update
    const student = await verifyOwnership(req, Student, id);

    const updated = await Student.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: "Student updated",
      data: updated,
    });
  } catch (error) {
    res.status(error.message.includes("not found") ? 404 : 400)
      .json({ success: false, error: error.message });
  }
};

// Delete student
exports.deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ CRITICAL: Verify ownership before delete
    await verifyOwnership(req, Student, id);

    await Student.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Student deleted",
    });
  } catch (error) {
    res.status(error.message.includes("not found") ? 404 : 400)
      .json({ success: false, error: error.message });
  }
};
```

---

## Phase 5: Update Route Files

### Example: student.routes.js

```javascript
// routes/student.routes.js
const express = require("express");
const router = express.Router();
const { extractTenant } = require("../middleware/tenant");
const { authorize, checkPermission } = require("../middleware/authorize");
const studentController = require("../controllers/student.controller");

// ✅ CHANGED: Add extractTenant to all protected routes
router.get(
  "/",
  extractTenant,
  authorize(["admin", "manager", "counselor"]),
  checkPermission("students", "view"),
  studentController.getStudents
);

router.post(
  "/",
  extractTenant,
  authorize(["admin", "manager"]),
  checkPermission("students", "create"),
  studentController.createStudent
);

router.put(
  "/:id",
  extractTenant,
  authorize(["admin", "manager"]),
  checkPermission("students", "edit"),
  studentController.updateStudent
);

router.delete(
  "/:id",
  extractTenant,
  authorize(["admin", "manager"]),
  checkPermission("students", "delete"),
  studentController.deleteStudent
);

module.exports = router;
```

---

## Phase 6: Update Authentication Flow

### Registration (New Company)

```javascript
// controllers/auth.controller.js
const Company = require("../models/Company");
const User = require("../models/user.model");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  try {
    const { companyName, companyEmail, adminName, adminEmail, password } = req.body;

    // ✅ NEW: Create company first
    const company = new Company({
      name: companyName,
      email: companyEmail,
      subscription: {
        plan: "free",
        status: "trial",
        startDate: new Date(),
      },
    });
    await company.save();

    // ✅ NEW: Create admin user with company reference
    const user = new User({
      companyId: company._id, // CRITICAL
      name: adminName,
      email: adminEmail,
      password,
      role: "admin",
      permissions: [
        {
          resource: "students",
          actions: ["view", "create", "edit", "delete"],
        },
        {
          resource: "leads",
          actions: ["view", "create", "edit", "delete"],
        },
        {
          resource: "users",
          actions: ["view", "create", "edit", "delete"],
        },
      ],
    });
    await user.save();

    // Generate JWT with companyId
    const token = jwt.sign(user.toJWTPayload(), process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(201).json({
      success: true,
      message: "Company registered successfully",
      token,
      user: {
        userId: user._id,
        companyId: company._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Registration failed",
      error: error.message,
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user (no need to specify companyId in login)
    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // ✅ JWT now includes companyId
    const token = jwt.sign(user.toJWTPayload(), process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({
      success: true,
      token,
      user: {
        userId: user._id,
        companyId: user.companyId, // Included in response
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message,
    });
  }
};
```

---

## Phase 7: Update server.js

```javascript
// server.js - BEFORE & AFTER

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

// ✅ NEW: Import middleware
const { extractTenant } = require("./middleware/tenant");
const { handleErrors } = require("./middleware/errorHandler");

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// ✅ NEW: MongoDB connection with multi-tenancy ready
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => {
    console.error("❌ MongoDB Error:", err);
    process.exit(1);
  });

// ✅ UPDATED: Routes now require authentication
const authRoutes = require("./routes/auth.routes");
const studentRoutes = require("./routes/student.routes");
const userRoutes = require("./routes/user.routes");
const leadRoutes = require("./routes/lead.routes");

// Public routes (no tenant extraction)
app.use("/api/auth", authRoutes);

// Protected routes (with tenant extraction)
app.use("/api/students", extractTenant, studentRoutes);
app.use("/api/users", extractTenant, userRoutes);
app.use("/api/leads", extractTenant, leadRoutes);

// ✅ NEW: Error handling middleware
app.use(handleErrors);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
```

---

## Phase 8: Testing Checklist

### Test Registration
```bash
POST /api/auth/register
{
  "companyName": "Acme Education",
  "companyEmail": "admin@acme.com",
  "adminName": "John Doe",
  "adminEmail": "john@acme.com",
  "password": "SecurePass123"
}
```

Expected: JWT token with companyId included

### Test Data Isolation
```bash
# Login as Company A admin
POST /api/auth/login
Response: Token with companyId = "123"

# Get students - should only see Company A students
GET /api/students
Authorization: Bearer <token>
Response: { data: [ students from Company A only ] }

# Login as Company B admin
POST /api/auth/login
Response: Token with companyId = "456"

# Get students - should ONLY see Company B students
GET /api/students
Authorization: Bearer <token>
Response: { data: [ students from Company B only ] }
```

### Test Authorization
```bash
# Counselor trying to delete student
DELETE /api/students/123
Authorization: Bearer <counselor_token>

Expected: 403 Forbidden - "Only administrators can delete"
```

### Test Audit Logging
```bash
# Create student
POST /api/students
{
  "fullName": "Jane Smith",
  "email": "jane@example.com"
}

# Check audit log
GET /api/audit-logs?resource=student&action=create

Expected: Log entry showing who created what when
```

---

## Phase 9: Migration Strategy for Existing Data

### Backfill companyId for existing users/students

```javascript
// migrate.js - Run once to add companyId to old records

async function migrateToMultiTenant() {
  // Get or create default company
  let company = await Company.findOne({ name: "Default" });
  if (!company) {
    company = new Company({
      name: "Default",
      email: "default@company.com",
      companyId: "COMP_DEFAULT",
    });
    await company.save();
  }

  // Add companyId to all users without one
  const usersUpdated = await User.updateMany(
    { companyId: { $exists: false } },
    { $set: { companyId: company._id } }
  );
  console.log(`✅ Updated ${usersUpdated.modifiedCount} users`);

  // Add companyId to all students without one
  const studentsUpdated = await Student.updateMany(
    { companyId: { $exists: false } },
    { $set: { companyId: company._id } }
  );
  console.log(`✅ Updated ${studentsUpdated.modifiedCount} students`);

  // Create compound indexes
  await User.collection.createIndex({ companyId: 1, email: 1 }, { unique: true });
  await Student.collection.createIndex({ companyId: 1, email: 1 }, { unique: true });

  console.log("✅ Migration complete!");
}

migrateToMultiTenant();
```

---

## Phase 10: Security Hardening

### Rate Limiting by Company
```javascript
const rateLimit = require("express-rate-limit");

// Limit API calls per company
const tenantLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // max requests per windowMs per tenant
  keyGenerator: (req) => `${req.companyId}`, // Rate limit by company
  message: "Too many requests, please try again later",
});

app.use("/api/", tenantLimiter);
```

### SQL/NoSQL Injection Prevention
```javascript
// ✅ Always use parameterized queries (Mongoose does this)
// ✅ AVOID string concatenation in queries

// ❌ VULNERABLE
Student.find({ companyId: req.query.companyId });

// ✅ SAFE
const { buildTenantQuery } = require("../utils/tenantContext");
const query = buildTenantQuery(req);
Student.find(query);
```

### Sensitive Data Protection
```javascript
// ✅ Use select: false for sensitive fields
password: {
  type: String,
  required: true,
  select: false, // Won't be returned by default
}

// ✅ Only fetch when needed
const user = await User.findById(id).select("+password");
```

---

## 📝 Production Deployment Checklist

- [ ] All models have companyId indexes created
- [ ] extractTenant middleware applied to all protected routes
- [ ] No queries written without company filter
- [ ] All controllers updated to use tenantContext helpers
- [ ] JWT tokens include companyId
- [ ] Rate limiting configured per company
- [ ] Audit logs enabled
- [ ] Super admin endpoints secured with checkSuperAdmin middleware
- [ ] Backup and restore maintains company isolation
- [ ] Monitoring alerts for cross-tenant data leaks
- [ ] Documentation updated for new developers

---

## 🚀 Next Steps

1. **Phase 1-7**: Implement all code changes above
2. **Verify**: Run full test suite with multi-tenant scenarios
3. **Deploy**: Roll out to staging first
4. **Monitor**: Check logs for data isolation issues
5. **Phase 11**: Implement company management UI in frontend

---

## 📚 Reference Links

- [Company Model Details](../Backend/models/Company.js)
- [User Model with Permissions](../Backend/models/user.model.js)
- [Tenant Middleware](../Backend/middleware/tenant.js)
- [Authorization Middleware](../Backend/middleware/authorize.js)
- [Tenant Context Utilities](../Backend/utils/tenantContext.js)
- [Architecture Design](../SAAS_ARCHITECTURE.md)


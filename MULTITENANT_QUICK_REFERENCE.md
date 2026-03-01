# Multi-Tenant Quick Reference - Developer Guide

## 🚀 Quick Start Pattern

### 1. Every Route
```javascript
const { extractTenant } = require("../middleware/tenant");
const { authorize } = require("../middleware/authorize");

router.post("/students", 
  extractTenant,                    // ← Required
  authorize(["admin", "manager"]),  // ← Optional
  controller.createStudent
);
```

### 2. Every Query
```javascript
// ❌ WRONG
const students = await Student.find({ status: "Active" });

// ✅ RIGHT
const { getTenantFilter } = require("../utils/tenantContext");
const students = await Student.find({
  ...getTenantFilter(req),          // ← Include this
  status: "Active"
});

// OR BETTER
const { executeSafeQuery } = require("../utils/tenantContext");
const students = await executeSafeQuery(req, Student, { status: "Active" });
```

### 3. Every Create/Update/Delete
```javascript
// Before any modification, verify ownership
const { verifyOwnership } = require("../utils/tenantContext");

// This throws if student belongs to different company
const student = await verifyOwnership(req, Student, studentId);

// Now safe to modify
await Student.findByIdAndUpdate(studentId, updates);
```

---

## 📋 Copy-Paste Templates

### New Route File Template
```javascript
// routes/resource.routes.js
const express = require("express");
const router = express.Router();
const { extractTenant } = require("../middleware/tenant");
const { authorize, checkPermission } = require("../middleware/authorize");
const controller = require("../controllers/resource.controller");

// GET all
router.get("/", 
  extractTenant, 
  authorize(["admin", "manager", "counselor"]),
  checkPermission("resource", "view"),
  controller.getAll
);

// POST create
router.post("/", 
  extractTenant,
  authorize(["admin", "manager"]),
  checkPermission("resource", "create"),
  controller.create
);

// PUT update
router.put("/:id",
  extractTenant,
  authorize(["admin", "manager"]),
  checkPermission("resource", "edit"),
  controller.update
);

// DELETE
router.delete("/:id",
  extractTenant,
  authorize(["admin"]),
  checkPermission("resource", "delete"),
  controller.delete
);

module.exports = router;
```

### New Controller Function Template
```javascript
// controllers/resource.controller.js
const { 
  getTenantFilter, 
  verifyOwnership,
  executeSafeQuery,
  getPaginatedResults 
} = require("../utils/tenantContext");
const AuditLog = require("../models/AuditLog");

exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    // Paginated query with company isolation
    const results = await getPaginatedResults(
      req,
      Resource,
      {},
      page,
      limit
    );

    res.json({
      success: true,
      data: results.data,
      pagination: results
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    // Auto-attach companyId
    const data = {
      ...req.body,
      companyId: req.companyId  // ← KEY LINE
    };

    const resource = new Resource(data);
    await resource.save();

    // Log action
    await AuditLog.logAction({
      companyId: req.companyId,
      userId: req.userId,
      userName: req.user.name,
      action: "create",
      resource: "resource",
      resourceId: resource._id,
      changes: { before: {}, after: data }
    });

    res.status(201).json({ success: true, data: resource });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify ownership (prevents cross-tenant updates)
    const resource = await verifyOwnership(req, Resource, id);

    const beforeData = resource.toObject();
    
    const updated = await Resource.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    );

    // Log action
    await AuditLog.logAction({
      companyId: req.companyId,
      userId: req.userId,
      userName: req.user.name,
      action: "update",
      resource: "resource",
      resourceId: id,
      changes: { before: beforeData, after: updated }
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(error.message.includes("not found") ? 404 : 400)
      .json({ success: false, error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify ownership
    const resource = await verifyOwnership(req, Resource, id);
    
    const data = resource.toObject();
    
    // Soft delete
    await Resource.findByIdAndUpdate(id, { deletedAt: new Date() });

    // Log action
    await AuditLog.logAction({
      companyId: req.companyId,
      userId: req.userId,
      userName: req.user.name,
      action: "delete",
      resource: "resource",
      resourceId: id,
      changes: { before: data, after: null }
    });

    res.json({ success: true, message: "Deleted" });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
};
```

---

## ❌ Common Mistakes

### ❌ Mistake 1: Forgetting extractTenant
```javascript
// WRONG
router.get("/students", controller.getStudents);

// RIGHT
router.get("/students", extractTenant, controller.getStudents);
```

### ❌ Mistake 2: Not filtering by companyId
```javascript
// WRONG - Returns data from all companies!
const students = await Student.find({ status: "Active" });

// RIGHT
const students = await Student.find({ 
  companyId: req.companyId, 
  status: "Active" 
});
```

### ❌ Mistake 3: Not verifying ownership
```javascript
// WRONG - Could update another company's data!
await Student.findByIdAndUpdate(studentId, { status: "Visa Approved" });

// RIGHT
await verifyOwnership(req, Student, studentId);
await Student.findByIdAndUpdate(studentId, { status: "Visa Approved" });
```

### ❌ Mistake 4: Forgetting to attach companyId when creating
```javascript
// WRONG - Company not set!
const student = new Student({
  fullName: "John",
  email: "john@email.com"
});
await student.save();

// RIGHT
const student = new Student({
  companyId: req.companyId,  // ← MUST INCLUDE
  fullName: "John",
  email: "john@email.com"
});
await student.save();
```

### ❌ Mistake 5: Allowing counselors to perform admin actions
```javascript
// WRONG - All roles allowed!
router.post("/students", extractTenant, controller.createStudent);

// RIGHT
router.post("/students", 
  extractTenant,
  authorize(["admin", "manager"]),  // ← Restrict roles
  controller.createStudent
);
```

---

## 🔐 Security Checklist Per Feature

### When Adding a New Resource
- [ ] Add `companyId` field to schema
- [ ] Create compound index: `{ companyId: 1, uniqueField: 1 }`
- [ ] All queries include `{ companyId: req.companyId, ... }`
- [ ] All modifications call `verifyOwnership()`
- [ ] Routes wrapped with `extractTenant` middleware
- [ ] Routes wrapped with `authorize()` middleware
- [ ] Audit logs created for all CRUD operations
- [ ] Test data isolation (Company A ≠ Company B)

---

## 🧪 Quick Tests

### Test: Data Isolation
```javascript
// Should return user's students ONLY
GET /api/students
Authorization: Bearer <company_a_token>
// Response: Students from Company A only

// Different company should get different data
GET /api/students
Authorization: Bearer <company_b_token>
// Response: Students from Company B only
```

### Test: Ownership Verification
```javascript
// Get student ID from Company B
GET /api/students
Authorization: Bearer <company_b_token>

// Try to update with Company A token
PUT /api/students/<company_b_student_id>
Authorization: Bearer <company_a_token>
// Response: Should be 404 or "Unauthorized"
```

### Test: Authorization
```javascript
// Counselor tries to delete student
DELETE /api/students/123
Authorization: Bearer <counselor_token>
// Response: 403 Forbidden
```

---

## 📊 Key Files Reference

| What You Need | Where To Find It |
|---------------|------------------|
| Company Model | `Backend/models/Company.js` |
| User Model | `Backend/models/user.model.js` |
| Student Model | `Backend/models/student.model.js` |
| Tenant Middleware | `Backend/middleware/tenant.js` |
| Auth Middleware | `Backend/middleware/authorize.js` |
| Query Helpers | `Backend/utils/tenantContext.js` |
| Audit Log Model | `Backend/models/AuditLog.js` |
| Example Controller | `Backend/controllers/student.controller.example.js` |
| Full Guide | `MULTITENANT_IMPLEMENTATION_GUIDE.md` |
| Architecture | `SAAS_ARCHITECTURE.md` |
| Testing Guide | `MULTITENANT_TESTING_GUIDE.md` |

---

## 🎓 Helpful Tips

### Tip 1: Use IDE Search/Replace
Find all instances of:
```
Student.find({
```

Replace with:
```
Student.find({ companyId: req.companyId,
```

### Tip 2: Create Helper Function
```javascript
// Wrap common queries
const getCompanyStudents = (companyId, filters = {}) => {
  return Student.find({ companyId, ...filters });
};

// Usage
const students = await getCompanyStudents(req.companyId, { status: "Active" });
```

### Tip 3: Test in Batches
Update one controller → Test → Move to next

### Tip 4: Use Postman Collections
Create Postman collection with:
- Company A tokens
- Company B tokens
- Pre-populated requests
- Tests to verify isolation

### Tip 5: Monitor Logs
Watch for `[Tenant]` logs:
```bash
tail -f logs/combined.log | grep "\[Tenant\]"
```

---

## 🆘 Debugging

### When something seems wrong...

1. **Check extractTenant is applied**
   ```javascript
   // Routes should have this
   router.route("/path", extractTenant, ...)
   ```

2. **Verify companyId in token**
   ```bash
   # Paste token at jwt.io to verify
   # Should see: "companyId": "507f1f77bcf86cd799439011"
   ```

3. **Check database directly**
   ```bash
   # Should see companyId on all documents
   db.students.findOne({}).pretty()
   ```

4. **Review audit logs**
   ```bash
   # Should see who did what
   db.audit_logs.find({}).sort({ createdAt: -1 })
   ```

5. **Look for console errors**
   ```bash
   # Check app logs
   pm2 logs app-name | tail -50
   ```

---

## 💡 Pro Tips

### Performance
- Use `.lean()` for read-only queries to save memory
- Use `.select()` to limit fields returned
- Create indexes before production

### Security
- Never log passwords or tokens
- Always validate inputs
- Use rate limiting
- Enable HTTPS only

### Debugging
- Add detailed error messages
- Log all audit actions
- Monitor query performance
- Set up alerts for anomalies

### Code Quality
- Use consistent namingvconventions
- Add JSDoc comments
- Write unit tests for utilities
- Use TypeScript for better type safety

---

## 📞 When You're Stuck

1. **Check MULTITENANT_IMPLEMENTATION_GUIDE.md** - Has step-by-step instructions
2. **Review student.controller.example.js** - Shows working implementation
3. **Run MULTITENANT_TESTING_GUIDE.md** tests - Verifies your setup
4. **Check SAAS_ARCHITECTURE.md diagrams** - Visualize the flow
5. **Search this Quick Reference** - Patterns and examples

---

**Good luck! You're building a production-grade SaaS platform! 🎉**

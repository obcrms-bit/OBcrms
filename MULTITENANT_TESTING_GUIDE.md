# Multi-Tenant Testing & Verification Guide

## 🧪 Testing Strategy

This guide shows how to verify that multi-tenant data isolation, authorization, and audit logging work correctly.

---

## Part 1: Setup Test Environment

### Start Fresh Database

```bash
# Clear existing data
mongosh
> use trust-education
> db.companies.deleteMany({})
> db.users.deleteMany({})
> db.students.deleteMany({})
> db.audit_logs.deleteMany({})
> exit
```

### Seed Test Data

```javascript
// seed-multitenant.js
const mongoose = require("mongoose");
const bcryptjs = require("bcryptjs");
require("dotenv").config();

const Company = require("./models/Company");
const User = require("./models/user.model");
const Student = require("./models/student.model");

async function seedMultiTenant() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    // Create Company A
    const companyA = new Company({
      companyId: "COMP_ACME001",
      name: "ACME Education",
      email: "admin@acme.com",
      country: "USA",
      subscription: {
        plan: "professional",
        status: "active",
        features: ["students_crm", "leads_management", "sms_automation"],
      },
    });
    await companyA.save();

    // Create Company B
    const companyB = new Company({
      companyId: "COMP_GLOBAL002",
      name: "Global Education",
      email: "admin@global.com",
      country: "UK",
      subscription: {
        plan: "professional",
        status: "active",
        features: ["students_crm", "leads_management"],
      },
    });
    await companyB.save();

    console.log("✅ Companies created");

    // Create Users for Company A
    const adminA = new User({
      companyId: companyA._id,
      name: "Admin A",
      email: "admin@acme.com",
      password: "Admin@123456",
      role: "admin",
      permissions: [
        { resource: "students", actions: ["view", "create", "edit", "delete"] },
        { resource: "leads", actions: ["view", "create", "edit", "delete"] },
        { resource: "users", actions: ["view", "create", "edit", "delete"] },
      ],
    });
    await adminA.save();

    const counselorA = new User({
      companyId: companyA._id,
      name: "Counselor A",
      email: "counselor@acme.com",
      password: "Counselor@123456",
      role: "counselor",
      permissions: [
        { resource: "students", actions: ["view", "edit"] },
      ],
    });
    await counselorA.save();

    console.log("✅ Users for Company A created");

    // Create Users for Company B
    const adminB = new User({
      companyId: companyB._id,
      name: "Admin B",
      email: "admin@global.com",
      password: "Admin@123456",
      role: "admin",
      permissions: [
        { resource: "students", actions: ["view", "create", "edit", "delete"] },
        { resource: "leads", actions: ["view", "create", "edit", "delete"] },
        { resource: "users", actions: ["view", "create", "edit", "delete"] },
      ],
    });
    await adminB.save();

    const counselorB = new User({
      companyId: companyB._id,
      name: "Counselor B",
      email: "counselor@global.com",
      password: "Counselor@123456",
      role: "counselor",
      permissions: [
        { resource: "students", actions: ["view", "edit"] },
      ],
    });
    await counselorB.save();

    console.log("✅ Users for Company B created");

    // Create Students for Company A
    for (let i = 1; i <= 5; i++) {
      const student = new Student({
        companyId: companyA._id,
        fullName: `Company A Student ${i}`,
        email: `student${i}@acme.com`,
        course: "Master's",
        countryInterested: "Canada",
        assignedCounselor: counselorA._id,
        assignedCounselorName: "Counselor A",
      });
      await student.save();
    }

    console.log("✅ Students for Company A created");

    // Create Students for Company B
    for (let i = 1; i <= 5; i++) {
      const student = new Student({
        companyId: companyB._id,
        fullName: `Company B Student ${i}`,
        email: `student${i}@global.com`,
        course: "Bachelor's",
        countryInterested: "USA",
        assignedCounselor: counselorB._id,
        assignedCounselorName: "Counselor B",
      });
      await student.save();
    }

    console.log("✅ Students for Company B created");
    console.log("\n✅✅✅ SEEDING COMPLETE ✅✅✅\n");

    console.log("TEST CREDENTIALS:");
    console.log("\nCompany A:");
    console.log("  Admin: admin@acme.com / Admin@123456");
    console.log("  Counselor: counselor@acme.com / Counselor@123456");
    console.log("\nCompany B:");
    console.log("  Admin: admin@global.com / Admin@123456");
    console.log("  Counselor: counselor@global.com / Counselor@123456");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seedMultiTenant();
```

Run it:
```bash
node seed-multitenant.js
```

---

## Part 2: Test Data Isolation

### Test 1: Login Company A Admin

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@acme.com",
  "password": "Admin@123456"
}
```

Expected Response:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "userId": "...",
    "companyId": "507f1f77bcf86cd799439011",  ← Note the companyId
    "name": "Admin A",
    "email": "admin@acme.com",
    "role": "admin"
  }
}
```

✅ **VERIFY**: Token includes `companyId`

### Test 2: Get All Students (Company A)

```bash
GET /api/students
Authorization: Bearer <token_from_company_a_admin>
```

Expected Response:
```json
{
  "success": true,
  "data": [
    {
      "fullName": "Company A Student 1",
      "email": "student1@acme.com",
      "companyId": "507f1f77bcf86cd799439011"
    },
    {
      "fullName": "Company A Student 2",
      "email": "student2@acme.com", 
      "companyId": "507f1f77bcf86cd799439011"
    },
    // ... more Company A students
  ],
  "pagination": {
    "total": 5,
    "page": 1,
    "pages": 1,
    "limit": 10
  }
}
```

✅ **VERIFY**: Only Company A students returned (5 total)

### Test 3: Login Company B Admin

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@global.com",
  "password": "Admin@123456"
}
```

### Test 4: Get All Students (Company B)

```bash
GET /api/students
Authorization: Bearer <token_from_company_b_admin>
```

Expected Response:
```json
{
  "success": true,
  "data": [
    {
      "fullName": "Company B Student 1",
      "email": "student1@global.com",
      "companyId": "60d7a8f5c2e8f0a1b2c3d5e6"  ← Different! 
    },
    // ... more Company B students only
  ],
  "pagination": {
    "total": 5
  }
}
```

✅ **VERIFY**: Only Company B students returned (5 total, different companyId)

---

## Part 3: Test Authorization & Permissions

### Test 5: Counselor Cannot Delete Student

```bash
DELETE /api/students/507f1f77bcf86cd799439015
Authorization: Bearer <token_from_counselor_a>
```

Expected Response (403 Forbidden):
```json
{
  "success": false,
  "message": "Insufficient permissions",
  "error": "This action requires one of these roles: admin, manager"
}
```

✅ **VERIFY**: Counselor correctly denied delete permission

### Test 6: Counselor Cannot See Other Counselor's Students

Assume Company A has:
- Counselor A: assigned to Student 1-3
- Counselor B: assigned to Student 4-5

```bash
GET /api/students
Authorization: Bearer <token_from_counselor_a>
```

Expected Response:
```json
{
  "success": true,
  "data": [
    {
      "fullName": "Company A Student 1",
      "assignedCounselor": "counselor_a_id"
    },
    {
      "fullName": "Company A Student 2",
      "assignedCounselor": "counselor_a_id"
    },
    {
      "fullName": "Company A Student 3",
      "assignedCounselor": "counselor_a_id"
    }
  ],
  "pagination": { "total": 3 }  ← Only 3, not 5!
}
```

✅ **VERIFY**: Counselor only sees their 3 assigned students

### Test 7: Admin Can See All Students

```bash
GET /api/students
Authorization: Bearer <token_from_admin_a>
```

Expected Response:
```json
{
  "success": true,
  "data": [
    // All 5 students from Company A
  ],
  "pagination": { "total": 5 }
}
```

✅ **VERIFY**: Admin sees all 5 students

---

## Part 4: Test Data Modification & Ownership

### Test 8: Cannot Update Other Company's Student

Get a student ID from Company B:
```bash
GET /api/students?limit=1
Authorization: Bearer <token_from_company_b_admin>
```

Response: `studentB_id = "60d7a8f5c2e8f0a1b2c3d5e6"`

Now try to update with Company A token:
```bash
PUT /api/students/60d7a8f5c2e8f0a1b2c3d5e6
Authorization: Bearer <token_from_company_a_admin>
Content-Type: application/json

{
  "status": "Visa Approved"
}
```

Expected Response (404 or 403):
```json
{
  "success": false,
  "message": "Student not found",
  "error": "Unauthorized: Resource belongs to different company"
}
```

✅ **VERIFY**: Cannot modify another company's data

### Test 9: Cannot Delete Other Company's Student

```bash
DELETE /api/students/60d7a8f5c2e8f0a1b2c3d5e6
Authorization: Bearer <token_from_company_a_admin>
```

Expected Response (404 or 403):
```json
{
  "success": false,
  "message": "Student not found",
  "error": "Unauthorized: Resource belongs to different company"
}
```

✅ **VERIFY**: Cannot delete another company's data

---

## Part 5: Test Audit Logging

### Test 10: Audit Log Entry Created

Update a student:
```bash
PUT /api/students/507f1f77bcf86cd799439015
Authorization: Bearer <token_from_admin_a>
Content-Type: application/json

{
  "status": "Applied"
}
```

Check audit logs in MongoDB:
```bash
mongosh
> use trust-education
> db.audit_logs.find({ 
    resource: "student",
    action: "update",
    userId: ObjectId("...")
  }).pretty()
```

Expected Entry:
```json
{
  "_id": ObjectId(...),
  "companyId": ObjectId("507f1f77bcf86cd799439011"),  ← Company A
  "userId": ObjectId(...),
  "userName": "Admin A",
  "action": "update",
  "resource": "student",
  "resourceId": ObjectId("507f1f77bcf86cd799439015"),
  "resourceName": "Company A Student 1",
  "changes": {
    "before": { "status": "New" },
    "after": { "status": "Applied" }
  },
  "ipAddress": "127.0.0.1",
  "userAgent": "...",
  "createdAt": ISODate("2024-02-28T10:30:00Z")
}
```

✅ **VERIFY**: Audit log created with full details

### Test 11: Audit Logs Are Isolated

Get audit logs for Company A:
```javascript
db.audit_logs.find({ 
  companyId: ObjectId("507f1f77bcf86cd799439011")
}).count()
// Result: 1 (only Company A's actions)

db.audit_logs.find({ 
  companyId: ObjectId("60d7a8f5c2e8f0a1b2c3d5e6")
}).count()
// Result: 0 (Company B's audit logs separate)
```

✅ **VERIFY**: Audit logs properly isolated by company

---

## Part 6: Test Creation & Company Assignment

### Test 12: New Student Auto-Assigned to Correct Company

```bash
POST /api/students
Authorization: Bearer <token_from_admin_a>
Content-Type: application/json

{
  "fullName": "New Test Student",
  "email": "newstudent@acme.com",
  "course": "Bachelor's"
}
```

Expected Response:
```json
{
  "success": true,
  "data": {
    "fullName": "New Test Student",
    "email": "newstudent@acme.com",
    "companyId": "507f1f77bcf86cd799439011",  ← Automatically set!
    "createdAt": "...",
    "_id": "507f1f77bcf86cd799439999"
  }
}
```

Verify Company B cannot see it:
```bash
GET /api/students?search=NewTest
Authorization: Bearer <token_from_admin_b>
```

Response: `{ "data": [], "pagination": { "total": 0 } }`

✅ **VERIFY**: New student auto-assigned to correct company

---

## Part 7: Load Testing

### Test 13: Concurrent Requests From Multiple Companies

```javascript
// concurrent-test.js
const axios = require("axios");

async function testConcurrency() {
  const baseURL = "http://localhost:5000";
  
  // Get tokens
  const tokenA = await login("admin@acme.com", "Admin@123456");
  const tokenB = await login("admin@global.com", "Admin@123456");
  
  // Make concurrent requests
  const promises = [];
  
  for (let i = 0; i < 10; i++) {
    promises.push(
      axios.get(`${baseURL}/api/students`, {
        headers: { Authorization: `Bearer ${tokenA}` }
      })
    );
    promises.push(
      axios.get(`${baseURL}/api/students`, {
        headers: { Authorization: `Bearer ${tokenB}` }
      })
    );
  }
  
  const results = await Promise.all(promises);
  
  // Verify results
  results.forEach((res, index) => {
    const isFromCompanyA = index % 2 === 0;
    const companyId = res.data.data[0]?.companyId;
    console.log(`Request ${index}: Got ${res.data.data.length} students`);
  });
}

async function login(email, password) {
  const res = await axios.post("http://localhost:5000/api/auth/login", {
    email, password
  });
  return res.data.token;
}

testConcurrency();
```

Run: `node concurrent-test.js`

✅ **VERIFY**: 
- Company A always gets Company A students
- Company B always gets Company B students
- No race conditions or data mixing

---

## Part 8: SQL Injection & Security Tests

### Test 14: Attempt SQL/NoSQL Injection

```bash
GET /api/students?search="; db.students.deleteMany({}); //"
Authorization: Bearer <token>
```

Expected: 
- Injection safely handled
- No student deletion
- Returns search results only

✅ **VERIFY**: Injection attacks prevented

### Test 15: Token Tampering

Modify JWT token (change companyId):
```
Original: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Modified: (change companyId field)
```

Use modified token:
```bash
GET /api/students
Authorization: Bearer <modified_token>
```

Expected Response (401 Unauthorized):
```json
{
  "success": false,
  "message": "Invalid token",
  "error": "Token signature verification failed"
}
```

✅ **VERIFY**: Token tampering detected and rejected

---

## Part 9: Performance Benchmarks

### Test 16: Query Performance

Create index and measure:
```javascript
const mongoose = require("mongoose");

async function benchmark() {
  const Company = require("./models/Company");
  const companyId = "507f1f77bcf86cd799439011";
  
  console.time("Query with index");
  const students = await Student.find({ 
    companyId,
    status: "Active"
  }).explain("executionStats");
  console.timeEnd("Query with index");
  
  console.log("Examined documents:", students.executionStats.totalDocsExamined);
  console.log("Returned documents:", students.executionStats.nReturned);
  console.log("Index efficiency:", 
    (students.executionStats.nReturned / students.executionStats.totalDocsExamined * 100).toFixed(2) + "%"
  );
}

benchmark();
```

Expected: >90% index efficiency

✅ **VERIFY**: Queries are fast with proper indexes

---

## ✅ Verification Checklist

- [ ] **Data Isolation**: Company A can't see Company B students
- [ ] **Authorization**: Counselors can't perform admin actions
- [ ] **Ownership**: Can't modify/delete other company's data
- [ ] **Audit Logs**: All actions are tracked
- [ ] **Auto-Assignment**: New data assigned to correct company
- [ ] **Concurrency**: Multiple companies request simultaneously without issues
- [ ] **Security**: Injection attacks prevented, tokens verified
- [ ] **Performance**: Queries execute fast with indexes
- [ ] **Edge Cases**: Boundary conditions handled correctly

---

## 🧪 Regression Tests

After each deployment, run:

```bash
# Full test suite
npm test

# Multi-tenant specific
npm test -- --testNamePattern="multitenant"

# Security tests
npm test -- --testNamePattern="security"

# Performance tests
npm test -- --testNamePattern="performance"
```

---

## 📊 Test Report Template

```markdown
# Multi-Tenant Verification Report
Date: 2024-02-28
Tester: [Name]

## Data Isolation
- [ ] Company A students invisible to Company B admin ✅
- [ ] Company B students invisible to Company A admin ✅

## Authorization
- [ ] Counselor cannot delete students ✅
- [ ] Counselor only sees assigned students ✅
- [ ] Admin sees all company students ✅

## Data Modification
- [ ] Cannot update other company's student ✅
- [ ] Cannot delete other company's student ✅
- [ ] Can update own company's student ✅

## Audit Logs
- [ ] Create action logged ✅
- [ ] Update action logged with changes ✅
- [ ] Delete action logged ✅
- [ ] Logs isolated by company ✅

## Performance
- [ ] Query response time < 100ms ✅
- [ ] Can handle 100 concurrent requests ✅
- [ ] No index performance degradation ✅

## Security
- [ ] Token tampering rejected ✅
- [ ] Injection attacks prevented ✅
- [ ] Cross-tenant access blocked ✅

## Overall Status
✅ PASSED - All tests passing
```

---

Run these tests regularly to ensure multi-tenant integrity remains stable!

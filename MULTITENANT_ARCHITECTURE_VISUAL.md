# Multi-Tenant Architecture Visualization

## 1. Request Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      CLIENT REQUEST                             │
│              (with JWT token in header)                          │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                    ┌────────────▼──────────┐
                    │   extractTenant()     │
                    │   Middleware          │
                    ├───────────────────────┤
                    │ • Extract JWT        │
                    │ • Get companyId      │
                    │ • Verify company OK  │
                    │ • Attach to req      │
                    └────────────┬──────────┘
                                 │
                    ┌────────────▼──────────┐
                    │  authorize()          │
                    │  Middleware           │
                    ├───────────────────────┤
                    │ • Check role         │
                    │ • Verify permission  │
                    └────────────┬──────────┘
                                 │
                    ┌────────────▼──────────┐
                    │   Controller          │
                    │   Handler             │
                    ├───────────────────────┤
                    │ const filter = {      │
                    │   companyId:          │
                    │     req.companyId     │
                    │ }                     │
                    └────────────┬──────────┘
                                 │
                    ┌────────────▼──────────┐
                    │   Database Query      │
                    │                       │
                    │ find({ companyId })   │
                    │ ← Only Company A data │
                    └────────────┬──────────┘
                                 │
                    ┌────────────▼──────────┐
                    │   Response (JSON)     │
                    │   Company A data only │
                    └───────────────────────┘
```

---

## 2. Data Structure

```
DATABASE (Single MongoDB)
│
├─ Companies Collection
│  ├─ Company A (companyId: "COMP_ABC123")
│  │  └─ Subscription: free, active
│  │
│  └─ Company B (companyId: "COMP_XYZ789")
│     └─ Subscription: pro, active
│
├─ Users Collection
│  ├─ User [companyId: COMP_ABC123]
│  ├─ User [companyId: COMP_ABC123]
│  ├─ User [companyId: COMP_XYZ789]
│  └─ User [companyId: COMP_XYZ789]
│     ↑ All queries include companyId filter
│
├─ Students Collection
│  ├─ Student [companyId: COMP_ABC123]
│  ├─ Student [companyId: COMP_ABC123]
│  ├─ Student [companyId: COMP_XYZ789]
│  └─ Student [companyId: COMP_XYZ789]
│     ↑ All queries include companyId filter
│
└─ Audit Logs Collection
   ├─ Log [companyId: COMP_ABC123, action: create]
   └─ Log [companyId: COMP_XYZ789, action: update]
      ↑ Automatic tracking per company
```

---

## 3. JWT Token Structure

```
BEFORE (Single-Tenant):
{
  userId: "5f1a2b3c4d5e6f7g8h9i0j",
  email: "admin@example.com",
  role: "admin",
  iat: 1234567890,
  exp: 1234571490
}
↑ No company information ❌

AFTER (Multi-Tenant):
{
  userId: "5f1a2b3c4d5e6f7g8h9i0j",
  companyId: "507f1f77bcf86cd799439011",  ← CRITICAL
  email: "admin@company.com",
  name: "John Doe",
  role: "admin",
  iat: 1234567890,
  exp: 1234571490
}
↑ companyId embedded in token ✅
```

---

## 4. Query Isolation Pattern

```javascript
// BEFORE (Vulnerable to cross-tenant access):
const students = await Student.find({ status: "Active" });
// Returns ALL active students from ALL companies ❌

// AFTER (Safe multi-tenant):
const students = await Student.find({
  companyId: req.companyId,  // Automatic filtering
  status: "Active"
});
// Returns ONLY Company A's active students ✅
```

---

## 5. Role Hierarchy & Access Matrix

```
                 ┌─────────────────────────────────────┐
                 │      ACCESS CONTROL MATRIX          │
                 ├──────────┬───────┬─────────┬────────┤
                 │ Resource │Super  │ Admin   │Counsel │
                 │          │Admin  │        │ or    │
                 ├──────────┼───────┼─────────┼────────┤
                 │Companies │ CRUD  │  ✗      │  ✗     │
                 │Users     │ CRUD  │ CRU*D * │  ✗     │
                 │Students  │  R    │ CRUD    │  R*    │  
                 │Reports   │  R    │ CRUD    │  R*    │
                 │Billing   │ CRUD  │  U      │  ✗     │
                 ├──────────┴───────┴─────────┴────────┤
                 │ * = Limited to own company           │
                 │ ** = Limited to assigned students    │
                 └─────────────────────────────────────┘
```

---

## 6. Multi-Company Scenario

```
REQUEST 1: Company A Admin
┌────────────────────────────────┐
│ GET /api/students              │
│ Authorization: Bearer JWT_A     │
│ (token contains companyId: A)   │
└────┬─────────────────────────────┘
     │
     ├─ extractTenant() → req.companyId = A
     ├─ Controller: find({ companyId: A })
     │
     └─ RESPONSE: [Student from A, Student from A]
         Database returns: 👥 👥


REQUEST 2: Company B Admin (Same Database!)
┌────────────────────────────────┐
│ GET /api/students              │
│ Authorization: Bearer JWT_B     │
│ (token contains companyId: B)   │
└────┬─────────────────────────────┘
     │
     ├─ extractTenant() → req.companyId = B
     ├─ Controller: find({ companyId: B })
     │
     └─ RESPONSE: [Student from B, Student from B]
         Database returns: 😊 😊


KEY POINT: Same database, same students collection,
but completely isolated access!
```

---

## 7. Middleware Chain Execution

```
Request arrives
    ↓
[1] Express Built-ins
    ├─ cors()
    ├─ express.json()
    └─ requestLogger()
    ↓
[2] extractTenant Middleware ⭐ CRITICAL
    ├─ Verify JWT signature
    ├─ Extract companyId from token
    ├─ Check company is active
    └─ req.companyId = extracted value
    ↓
[3] authorize Middleware (Optional)
    ├─ Check user.role in allowedRoles
    ├─ Verify permissions for resource
    └─ Grant/deny access
    ↓
[4] Route Handler
    └─ executeQuery(req) → auto-filters by companyId
    ↓
[5] Response Handler
    └─ Only returns company-scoped data
```

---

## 8. Deployment Architecture

```
┌────────────────────────────────────────────────────┐
│            PRODUCTION LOAD BALANCER                │
└────────────────────┬───────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
    ┌───▼───┐    ┌───▼───┐   ┌───▼───┐
    │Instance│    │Instance│   │Instance│
    │   1    │    │   2    │   │   3    │
    │        │    │        │   │        │
    │Express │    │Express │   │Express │
    │ App    │    │ App    │   │ App    │
    └───┬────┘    └───┬────┘   └───┬────┘
        │             │            │
        └─────────────┼────────────┘
                      │
              ┌───────▼──────┐
              │   MongoDB    │
              │ (Shared DB - │
              │ Row-level    │
              │ isolation)   │
              └──────────────┘

All instances share:
- Same MongoDB database
- Data isolated by companyId
- Horizontal scale without DB changes
```

---

## 9. Data Flow Example: Create Student

```
┌─ STEP 1: Client Submits Form ─────────────────────┐
│                                                   │
│ POST /api/students                                │
│ Body: {                                           │
│   "fullName": "Alice Smith",                      │
│   "email": "alice@example.com",                   │
│   "course": "Master's"                            │
│ }                                                 │
│                                                   │
│ Header: Authorization: Bearer JWT_COMPANY_A       │
└─────────────────────────────┬─────────────────────┘
                              │
┌─ STEP 2: extractTenant Middleware ────────────────┐
│                                                   │
│ • Decode JWT                                      │
│ • Extract: companyId = "507f191e810c19729de860ea"│
│ • Verify company is active ✓                      │
│ • req.companyId = "507f191e810c19729de860ea"     │
│                                                   │
└─────────────────────────────┬─────────────────────┘
                              │
┌─ STEP 3: authorize Middleware ────────────────────┐
│                                                   │
│ • Check role: admin ✓ (allowed to create)        │
│ • Check permission: students:create ✓            │
│                                                   │
└─────────────────────────────┬─────────────────────┘
                              │
┌─ STEP 4: Controller Handler ──────────────────────┐
│                                                   │
│ const studentData = {                             │
│   fullName: "Alice Smith",                        │
│   email: "alice@example.com",                     │
│   course: "Master's",                             │
│   companyId: req.companyId  ← ATTACHED!           │
│ }                                                 │
│                                                   │
│ const student = new Student(studentData)          │
│ await student.save()                              │
│                                                   │
└─────────────────────────────┬─────────────────────┘
                              │
┌─ STEP 5: Database ────────────────────────────────┐
│                                                   │
│ INSERT INTO students {                            │
│   _id: ObjectId,                                  │
│   fullName: "Alice Smith",                        │
│   email: "alice@example.com",                     │
│   companyId: "507f191e810c19729de860ea",  ← KEY! │
│   course: "Master's",                            │
│   createdAt: ...                                  │
│ }                                                 │
│                                                   │
│ Index ensures uniqueness per company:             │
│ db.students.createIndex(                          │
│   { companyId: 1, email: 1 },                     │
│   { unique: true }                                │
│ )                                                 │
│                                                   │
└─────────────────────────────┬─────────────────────┘
                              │
┌─ STEP 6: Audit Log ───────────────────────────────┐
│                                                   │
│ INSERT INTO audit_logs {                          │
│   companyId: "507f191e810c19729de860ea",         │
│   userId: req.userId,                            │
│   action: "create",                              │
│   resource: "student",                           │
│   resourceId: ObjectId,                          │
│   resourceName: "Alice Smith",                   │
│   timestamp: now                                  │
│ }                                                 │
│                                                   │
└─────────────────────────────┬─────────────────────┘
                              │
┌─ STEP 7: Response ────────────────────────────────┐
│                                                   │
│ 201 Created                                       │
│ {                                                 │
│   "success": true,                                │
│   "message": "Student created",                   │
│   "data": {                                       │
│     "_id": "60d7a8f5c2e8f0a1b2c3d4e5",           │
│     "fullName": "Alice Smith",                    │
│     "email": "alice@example.com",                 │
│     "course": "Master's",                         │
│     "companyId": "507f191e810c19729de860ea",     │
│     "createdAt": "2024-02-28T10:30:00Z"          │
│   }                                               │
│ }                                                 │
│                                                   │
│ ✅ Data is now permanently isolated by companyId! │
│                                                   │
└───────────────────────────────────────────────────┘
```

---

## 10. Query Performance Optimization

```
Index Strategy:
┌──────────────────────────────────────────────┐
│ Compound Indexes for Multi-Tenancy           │
├──────────────────────────────────────────────┤
│ { companyId: 1, email: 1 }     ← Unique     │
│ { companyId: 1, status: 1 }    ← Sort      │
│ { companyId: 1, createdAt: -1 }← Pagination│
│ { companyId: 1, name: "text" } ← Search    │
└──────────────────────────────────────────────┘

Query Execution:
┌──────────────────────────────────────────────┐
│ Using Index                                  │
│                                              │
│ Query: { companyId, status, createdAt }    │
│ Index:  { companyId: 1, status: 1, ...}   │
│ ↓                                           │
│ MongoDB scans only 2-3% of documents ✓    │
└──────────────────────────────────────────────┘
```

---

This architecture ensures:
✅ **Data Isolation**: No cross-tenant data leakage
✅ **Scalability**: Linear scaling with company count
✅ **Security**: companyId embedded in token
✅ **Performance**: Indexed queries per company
✅ **Compliance**: Audit logs for all actions
✅ **Flexibility**: Easy to add new features per company

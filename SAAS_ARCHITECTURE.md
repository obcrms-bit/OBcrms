# Multi-Tenant SaaS Architecture - Complete Design

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│           Multi-Tenant SaaS Infrastructure              │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ Company1 │  │ Company2 │  │ Company3 │              │
│  └──────────┘  └──────────┘  └──────────┘              │
│       ↓              ↓              ↓                    │
│  ┌──────────────────────────────────────────┐           │
│  │    Tenant Isolation Middleware           │           │
│  │  (Extract company_id + Filter queries)   │           │
│  └──────────────────────────────────────────┘           │
│       ↓                                                  │
│  ┌──────────────────────────────────────────┐           │
│  │         Single MongoDB Database          │           │
│  │     (Row-level isolation strategy)       │           │
│  ├──────────────────────────────────────────┤           │
│  │ • Companies Collection                   │           │
│  │ • Users (company_id indexed)             │           │
│  │ • Students (company_id indexed)          │           │
│  │ • Assignments (company_id indexed)       │           │
│  │ • Applications (company_id indexed)      │           │
│  └──────────────────────────────────────────┘           │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 Database Schema Design

### 1. Company Model (NEW)
```javascript
{
  _id: ObjectId,
  companyId: String (unique, short identifier like "comp_abc123"),
  name: String (required, unique),
  email: String (required, unique, company admin email),
  industry: String ("Education", "Healthcare", etc),
  country: String,
  timezone: String,
  
  // Subscription
  subscription: {
    plan: String ("free", "small", "pro", "enterprise"),
    status: String ("active", "suspended", "trial"),
    startDate: Date,
    renewalDate: Date,
    price: Number,
    features: [String] // ["students_crm", "leads_management", "sms_automation"]
  },
  
  // Settings
  settings: {
    maxUsers: Number (10, 50, 100, unlimited),
    maxStudents: Number,
    maxCounselors: Number,
    currency: String ("USD", "INR", etc),
    theme: String,
    logo: String (URL),
  },
  
  // Billing
  billing: {
    address: String,
    billingEmail: String,
    cardLast4: String,
    paymentMethod: String,
  },
  
  // Status
  isActive: Boolean (default: true),
  isPaused: Boolean (default: false),
  
  // Audit
  createdAt: Date,
  updatedAt: Date,
  createdBy: ObjectId (SuperAdmin user),
}
```

### 2. User Model (UPDATED)
```javascript
{
  _id: ObjectId,
  companyId: ObjectId (reference to Company, INDEXED),
  name: String (required),
  email: String (required),
  phone: String,
  password: String (hashed, required),
  
  // Role & Permissions
  role: String enum ["super_admin", "admin", "counselor", "manager"] (INDEXED),
  permissions: [
    {
      resource: String ("students", "leads", "reports", "users"),
      actions: [String] ("view", "create", "edit", "delete")
    }
  ],
  
  // Profile
  avatar: String (URL),
  department: String,
  jobTitle: String,
  
  // Status
  isActive: Boolean (default: true),
  lastLogin: Date,
  loginAttempts: Number (for brute force protection),
  
  // Audit
  createdAt: Date,
  updatedAt: Date,
}

// Unique Index
db.users.createIndex({ companyId: 1, email: 1 }, { unique: true })
db.users.createIndex({ companyId: 1, role: 1 })
```

### 3. Student Model (UPDATED)
```javascript
{
  _id: ObjectId,
  companyId: ObjectId (reference to Company, INDEXED),
  name: String (required),
  email: String (required),
  phone: String,
  
  // Academic
  course: String,
  interestedCountries: [String] ("USA", "Canada", "UK", etc),
  targetUniversities: [String],
  
  // Progress
  status: String enum ["new", "processing", "applied", "visa_approved", "rejected"],
  applicationSubmitted: Date,
  docsReceived: Date,
  visaApprovedDate: Date,
  
  // Assignment
  assignedCounselor: ObjectId (reference to User),
  assignedCounselorName: String (denormalized for quick access),
  
  // Communication
  notes: [
    {
      createdBy: ObjectId (User),
      text: String,
      createdAt: Date,
    }
  ],
  
  // Audit
  createdAt: Date,
  updatedAt: Date,
}

// Indexes for isolation and performance
db.students.createIndex({ companyId: 1, _id: 1 })
db.students.createIndex({ companyId: 1, assignedCounselor: 1 })
db.students.createIndex({ companyId: 1, status: 1 })
db.students.createIndex({ companyId: 1, email: 1 }, { unique: true })
```

### 4. Audit Log Model (NEW - for compliance)
```javascript
{
  _id: ObjectId,
  companyId: ObjectId,
  userId: ObjectId,
  action: String ("create", "update", "delete", "export"),
  resource: String ("student", "user", "report"),
  resourceId: ObjectId,
  changes: Object (before/after data),
  ipAddress: String,
  userAgent: String,
  timestamp: Date,
}
```

---

## 🔐 Role & Permission Matrix

```
┌────────────────┬──────────┬───────────┬────────────┬──────────┐
│ Resource       │ SuperAdm │ Admin     │ Counselor  │ Manager  │
├────────────────┼──────────┼───────────┼────────────┼──────────┤
│ Companies      │ CRU(D)   │ ✗         │ ✗          │ ✗        │
│ Users          │ CRUD     │ CR(U)D*   │ ✗          │ R        │
│ Students       │ R        │ CRUD      │ R*         │ CRUD     │
│ Reports        │ R        │ CRUD      │ R*         │ R        │
│ Settings       │ CRUD     │ U         │ ✗          │ ✗        │
│ Billing        │ CRUD     │ U         │ ✗          │ ✗        │
│ Audit Logs     │ R        │ R*        │ ✗          │ ✗        │
├────────────────┼──────────┼───────────┼────────────┼──────────┤
Legend:
C = Create
R = Read
U = Update
D = Delete
* = Restricted scope (only own company / assigned data)
```

---

## 📁 Scalable Backend Folder Structure

```
Backend/
├── config/
│   ├── database.js              # MongoDB connection
│   ├── jwt.js                   # JWT configuration
│   └── environment.js           # Env variables validation
│
├── models/
│   ├── Company.js               # ✅ NEW
│   ├── User.js                  # ✅ UPDATED
│   ├── Student.js               # ✅ UPDATED
│   ├── Application.js
│   ├── Lead.js
│   ├── Commission.js
│   └── AuditLog.js              # ✅ NEW
│
├── middleware/
│   ├── auth.js                  # JWT verification
│   ├── tenant.js                # ✅ NEW - Extract & validate company_id
│   ├── authorize.js             # ✅ NEW - Role-based access control
│   ├── errorHandler.js
│   └── requestLogger.js
│
├── controllers/
│   ├── auth/
│   │   ├── register.js          # Company registration
│   │   ├── login.js
│   │   └── refreshToken.js
│   │
│   ├── admin/
│   │   ├── companyController.js # ✅ NEW
│   │   ├── userController.js    # ✅ UPDATED
│   │   └── subscriptionController.js # ✅ NEW
│   │
│   ├── company/
│   │   ├── studentsController.js  # ✅ UPDATED
│   │   ├── leadsController.js
│   │   ├── reportsController.js
│   │   └── settingsController.js  # ✅ NEW
│   │
│   └── user/
│       ├── profileController.js
│       └── myStudentsController.js
│
├── routes/
│   ├── auth.routes.js           # Public routes
│   ├── admin.routes.js          # ✅ NEW - Super admin routes
│   ├── company.routes.js        # ✅ NEW - Company admin routes
│   ├── students.routes.js       # ✅ UPDATED
│   ├── users.routes.js
│   └── reports.routes.js
│
├── utils/
│   ├── validators.js
│   ├── formatters.js
│   ├── errorHandler.js
│   ├── auditLog.js              # ✅ NEW
│   └── tenantContext.js         # ✅ NEW - Helper for tenant isolation
│
├── seeds/
│   ├── seedCompany.js           # ✅ NEW
│   ├── seedUsers.js             # ✅ UPDATED
│   └── seedStudents.js
│
├── tests/
│   ├── auth.test.js
│   ├── tenant.test.js           # ✅ NEW
│   └── controllers.test.js
│
├── server.js                    # Entry point
├── package.json
└── .env
```

---

## 🔐 Middleware for Tenant Isolation

### 1. Tenant Extraction Middleware
```javascript
// middleware/tenant.js
const extractTenant = (req, res, next) => {
  try {
    // Get token from header
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    
    // Decode token to get user info
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach to request object
    req.user = decoded;
    req.companyId = decoded.companyId; // CRITICAL: Company isolation
    
    // Optional: Verify company exists and is active
    const company = await Company.findById(req.companyId);
    if (!company?.isActive) {
      return res.status(403).json({ error: 'Company access disabled' });
    }
    
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = extractTenant;
```

### 2. Authorization Middleware (Role-Based)
```javascript
// middleware/authorize.js
const authorize = (requiredRoles = [], requiredPermissions = []) => {
  return (req, res, next) => {
    // Check role
    if (requiredRoles.length && !requiredRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    // Check specific permissions
    if (requiredPermissions.length) {
      const hasPermission = req.user.permissions?.some(p =>
        requiredPermissions.includes(p.action)
      );
      if (!hasPermission) {
        return res.status(403).json({ error: 'Permission denied' });
      }
    }
    
    next();
  };
};

module.exports = authorize;
```

### 3. Query Isolation Helper
```javascript
// utils/tenantContext.js
const getTenantFilter = (req) => {
  // Automatically add company_id to all queries
  return { companyId: req.companyId };
};

// Example usage in controller:
const getStudents = async (req, res) => {
  const tenantFilter = getTenantFilter(req);
  
  // This ensures only students of this company are returned
  const students = await Student.find(tenantFilter);
  
  res.json(students);
};
```

---

## 🔄 Complete Request Flow for Data Isolation

```
CLIENT REQUEST (with JWT token)
    ↓
[extractTenant middleware]
  ├─ Decode JWT
  ├─ Extract companyId
  ├─ Attach to req.companyId
  └─ Verify company is active
    ↓
[authorize middleware]
  ├─ Check user role
  └─ Verify permissions
    ↓
[Controller]
  ├─ Get tenantFilter { companyId: req.companyId }
  ├─ Query: Student.find(tenantFilter)
  │ (Only returns this company's students)
  └─ Return data
    ↓
RESPONSE (isolated data only)
```

---

## 🗄️ Database Indexing Strategy

```javascript
// Critical indexes for performance with multi-tenancy

// Compound indexes (company + resource)
db.users.createIndex({ companyId: 1, email: 1 }, { unique: true })
db.users.createIndex({ companyId: 1, role: 1 })
db.students.createIndex({ companyId: 1, email: 1 }, { unique: true })
db.students.createIndex({ companyId: 1, status: 1 })
db.students.createIndex({ companyId: 1, assignedCounselor: 1 })

// TTL index for audit logs (auto-delete after 90 days)
db.auditLogs.createIndex({ timestamp: 1 }, { expireAfterSeconds: 7776000 })

// Text search for multi-tenant
db.students.createIndex({ 
  companyId: 1, 
  name: "text", 
  email: "text" 
})
```

---

## 🚀 Authentication & Authorization Flow

### Registration (New Company)
```
1. Company Registration
   ├─ Create Company document
   ├─ Create first Admin User
   ├─ Generate JWT with companyId
   └─ Return JWT token

2. JWT Structure
   {
     userId: "...",
     companyId: "...",        // CRITICAL
     email: "admin@company.com",
     role: "admin",
     iat: timestamp,
     exp: timestamp
   }
```

### Login
```
1. User submits email + password
2. Find user with that email (query: { email, companyId? })
3. Compare passwords
4. Create JWT with companyId embedded
5. Return token
```

---

## 📋 Phase-by-Phase Implementation Roadmap

### **Phase 1: Core Multi-Tenancy (Week 1-2)**
```
✓ Create Company model
✓ Update User model with company_id
✓ Create tenant middleware
✓ Update Student model with company_id
✓ Create compound indexes
✓ Update registration flow
✓ Test data isolation
```

### **Phase 2: Authorization (Week 2-3)**
```
✓ Create authorize middleware
✓ Update all routes to check permissions
✓ Implement role hierarchy
✓ Add permission matrix to User model
✓ Create audit logs
✓ Test authorization
```

### **Phase 3: Admin Interface (Week 3-4)**
```
✓ SuperAdmin company management route
✓ Company suspension/deletion logic
✓ Subscription management
✓ User management per company
✓ Admin dashboard
✓ Audit log viewer
```

### **Phase 4: Frontend Updates (Week 4-5)**
```
✓ Company switcher (for multi-company admins)
✓ User management UI
✓ Subscription settings UI
✓ Role-based UI visibility
✓ Company profile settings
✓ Audit logs viewer
```

### **Phase 5: Scalability & Optimization (Week 5-6)**
```
✓ Add caching (Redis) for company settings
✓ Database query optimization
✓ Rate limiting per company
✓ Backup strategy per company
✓ Performance monitoring
✓ Cost tracking per company
```

---

## 🛡️ Security Checklist

- [ ] All queries include `companyId` filter
- [ ] JWT includes `companyId`
- [ ] Company status checked in middleware
- [ ] Rate limiting per company
- [ ] Audit logs for all data modifications
- [ ] RBAC enforced on all endpoints
- [ ] SQL/NoSQL injection prevention
- [ ] CORS configured per company domain
- [ ] Encryption for sensitive data
- [ ] Backup strategy implemented

---

## ⚡ Performance Optimization

```javascript
// Query optimization example
// ❌ Bad: Missing index, slow on large datasets
const students = await Student.find({ companyId });

// ✅ Good: Uses compound index
const students = await Student
  .find({ companyId })
  .select('name email status') // Project only needed fields
  .limit(10)
  .lean(); // For read-only operations

// ✅ Better: With caching
const cacheKey = `company_${companyId}_students`;
let students = await cache.get(cacheKey);
if (!students) {
  students = await Student.find({ companyId }).lean();
  await cache.set(cacheKey, students, 3600); // 1 hour TTL
}
```

---

## 🔗 Key Dependencies to Add

```json
{
  "dependencies": {
    "express": "^5.2.1",
    "mongoose": "^9.2.2",
    "jsonwebtoken": "^9.1.0",
    "bcryptjs": "^2.4.3",
    "dotenv": "^16.0.0",
    "express-rate-limit": "^7.0.0",
    "joi": "^17.11.0",
    "stripe": "^14.0.0",
    "redis": "^4.6.0"
  }
}
```



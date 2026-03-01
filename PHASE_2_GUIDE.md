# Phase 2: Frontend-Backend Integration & Role-Based Dashboard

## Overview
Phase 2 focuses on connecting the React frontend to the Node.js backend with JWT authentication and building role-specific dashboards. This phase implements the complete authentication flow and dashboard architecture.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER (React)                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  LoginPage   │  │ AdminDashboard│  │CounselorDash │      │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│         ↓                  ↓                  ↓              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │          AuthContext (State Management)            │    │
│  │  • authAPI.login() / register() / logout()         │    │
│  │  • Token stored in localStorage                    │    │
│  │  • User role stored for conditional rendering      │    │
│  └─────────────────────────────────────────────────────┘    │
│         ↓                                                    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │       API Service (Axios with Interceptor)         │    │
│  │  • Auto-attach Authorization header (Bearer)       │    │
│  │  • Handle token expiry                             │    │
│  └─────────────────────────────────────────────────────┘    │
│         ↓                                                    │
├─────────────────────────────────────────────────────────────┤
│                 HTTP LAYER (Network)                        │
│  POST   /api/auth/login                                    │
│  GET    /api/students                                      │
│  PUT    /api/students/:id                                  │
│  GET    /api/dashboard/stats                               │
├─────────────────────────────────────────────────────────────┤
│              SERVER LAYER (Node.js/Express)                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Auth Route │  │ Student Route │  │Dashboard Route│      │
│  │  register()  │  │   getAll()    │  │   getStats() │      │
│  │   login()    │  │  create()     │  └──────────────┘       │
│  └──────────────┘  └──────────────┘                         │
│         ↓                  ↓                                 │
│  ┌─────────────────────────────────────────────────────┐    │
│  │     Middleware Layer (Security)                     │    │
│  │  • authMiddleware - verify JWT                      │    │
│  │  • restrictMiddleware - role-based access          │    │
│  └─────────────────────────────────────────────────────┘    │
│         ↓                                                    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │          Mongoose Models (Data Layer)              │    │
│  │  • User (admin, counselor)                         │    │
│  │  • Student (assigned to counselor)                 │    │
│  └─────────────────────────────────────────────────────┘    │
│         ↓                                                    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │           MongoDB Database                         │    │
│  │  Collections: users, students, applications, leads│    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Phase 2 Implementation Steps

### Step 1: Verify Backend API Status ✅

**What to check:**
- Backend server running on port 5000
- MongoDB connected
- All seed data created

**Commands:**
```bash
# Terminal 1 - Backend
cd Backend
npm run seed
node server.js
```

**Expected output:**
```
✅ MongoDB Connected Successfully
🚀 Server running on port 5000
```

---

### Step 2: Test All Backend Endpoints ✅

**Auth Endpoints:**
```bash
# Test Login (get JWT token)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@seed.com","password":"admin123"}'

# Expected Response:
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGc...",
    "user": {
      "id": "...",
      "name": "Admin",
      "role": "admin"
    }
  }
}
```

**Save the token** for testing protected routes:
```bash
TOKEN="eyJhbGc..."

# Test Protected Route (Students)
curl -X GET http://localhost:5000/api/students \
  -H "Authorization: Bearer $TOKEN"

# Test Admin-Only Route (Dashboard Stats)
curl -X GET http://localhost:5000/api/dashboard/stats \
  -H "Authorization: Bearer $TOKEN"
```

---

### Step 3: Start Frontend Development Server

```bash
# Terminal 2 - Frontend
cd Frontend
npm start
```

**Expected output:**
```
Compiled successfully!
Local: http://localhost:3000
```

**Open browser:** `http://localhost:3000` → You should see **LoginPage**

---

### Step 4: Build Complete Authentication Flow

**Current State:** AuthContext and LoginPage exist but may need verification.

**File: `Frontend/src/context/AuthContext.jsx`**

Verify it has:
```javascript
✅ login(email, password) function
   - Makes POST to /api/auth/login
   - Stores token in localStorage
   - Stores user data in state
   - Returns user data

✅ logout() function
   - Clears localStorage
   - Clears auth state

✅ register(name, email, password, role) function
   - Makes POST to /api/auth/register
   - Handles admin-only restriction
```

**File: `Frontend/src/pages/LoginPage.jsx`**

Should implement:
```javascript
✅ Form inputs: email, password
✅ Submit handler that calls authContext.login()
✅ Error display if login fails
✅ Redirect to /admin or /counselor after successful login
✅ Loading state during request
```

**File: `Frontend/src/services/api.js`**

Verify it has:
```javascript
✅ Axios instance with baseURL = http://localhost:5000/api
✅ Request interceptor that adds Authorization header
   - Header format: "Bearer <token>"
   - Gets token from localStorage
✅ Response interceptor for error handling
✅ Export functions:
   - authAPI.login()
   - authAPI.register()
   - studentsAPI.getAll()
   - studentsAPI.getById()
   - studentsAPI.create()
   - studentsAPI.update()
   - studentsAPI.delete()
   - dashboardAPI.getStats()
```

---

### Step 5: Build Admin Dashboard (`/admin`)

**Purpose:** Display all students, CRUD operations, counselor assignments, analytics

**File: `Frontend/src/pages/AdminDashboard.jsx`**

Should implement:

```javascript
// 1. STATE MANAGEMENT
- students: [] - all students
- page: 1 - current page
- limit: 10 - students per page
- search: "" - search term
- totalStudents: 0 - for pagination
- modalOpen: false - add/edit student modal
- loading: true - loading state
- error: null - error messages
- selectedStudent: null - for editing
- counselors: [] - list of counselors for assignment

// 2. LIFECYCLE (useEffect)
- Fetch students on component mount
- Fetch students on page/search change
- Fetch counselors list for dropdown
- Auto-refresh after create/update/delete

// 3. FUNCTIONS
- handleSearch(searchTerm) - filter students
- handlePageChange(page) - pagination
- handleCreateStudent() - add new student
- handleUpdateStudent(id, data) - edit student
- handleDeleteStudent(id) - remove student
- handleAssignCounselor(studentId, counselorId) - assign
- displayAnalytics() - show total, approved, pending counts

// 4. RENDER STRUCTURE
- Header with user info & logout
- Analytics cards (total students, visa approved, etc.)
- Search & filter bar
- Students table with columns:
  * Name, Email, Phone, Status
  * Assigned Counselor
  * Actions (edit, delete, assign)
- Pagination controls
- Modal for add/edit student
- Loading spinner
- Error alerts
```

**Key Data Structure:**
```javascript
{
  name: string,
  email: string,
  phone: string,
  course: string,
  status: "New" | "Processing" | "Applied" | "Visa Approved" | "Rejected",
  assignedCounselor: {
    id: string,
    name: string
  },
  notes: string,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

---

### Step 6: Build Counselor Dashboard (`/counselor`)

**Purpose:** Display assigned students, update status, add notes, read-only view

**File: `Frontend/src/pages/CounselorDashboard.jsx`**

Should implement:

```javascript
// 1. STATE MANAGEMENT
- myStudents: [] - only assigned students
- page: 1
- limit: 10
- search: ""
- totalStudents: 0
- modalOpen: false - update notes modal
- loading: true
- error: null
- selectedStudent: null - for notes update

// 2. LIFECYCLE
- Fetch only assigned students on mount
- Filter by current user ID (from auth context)
- Get count of status distribution
- Auto-refresh after updates

// 3. FUNCTIONS
- handleSearch(searchTerm) - filter within assigned students
- handlePageChange(page)
- handleUpdateStatus(studentId, newStatus)
- handleAddNotes(studentId, notes)
- displayStatusBreakdown() - show count by status

// 4. RENDER STRUCTURE
- Header with user info & logout
- Status breakdown (New: 5, Processing: 3, etc.)
- Search bar (searches only assigned students)
- Students table (NO delete button):
  * Name, Email, Course, Current Status
  * Notes, Last Updated
  * Actions (update status, add notes, view)
- Pagination
- Modal for status update & notes
- Read-only mode (cannot delete/create)
```

**Key Difference from Admin:**
```javascript
// Admin Query
GET /api/students?page=1&limit=10

// Counselor Query (backend filters by assignedCounselor = current user)
GET /api/students?page=1&limit=10&assignedCounselor=<userId>
```

---

### Step 7: Implement Protected Routes

**File: `Frontend/src/App.jsx`**

Should have route protection:

```javascript
import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';

// ProtectedRoute Component
function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <LoadingSpinner />;
  
  if (!user?.token) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
}

// Routes
<BrowserRouter>
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    
    <Route 
      path="/admin" 
      element={
        <ProtectedRoute requiredRole="admin">
          <AdminDashboard />
        </ProtectedRoute>
      } 
    />
    
    <Route 
      path="/counselor" 
      element={
        <ProtectedRoute requiredRole="counselor">
          <CounselorDashboard />
        </ProtectedRoute>
      } 
    />
    
    <Route path="*" element={<Navigate to="/login" />} />
  </Routes>
</BrowserRouter>
```

---

### Step 8: Implement API Interceptors

**File: `Frontend/src/services/api.js`**

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api'
});

// Request Interceptor - Add JWT Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor - Handle Errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

## Testing Workflow

### Test 1: Complete Login Flow

**Steps:**
1. Open `http://localhost:3000`
2. Enter `admin@seed.com` / `admin123`
3. Click "Login"
4. Should redirect to `/admin`
5. Check localStorage → token should be saved

**Test 2: Verify Backend Connectivity**

In browser DevTools Network tab:
- POST `/api/auth/login` → 200 OK
- Response includes `data.token`
- Check headers → `Authorization: Bearer <token> included`

**Test 3: Load Students Data**

- Admin Dashboard loads
- GET `/api/students` → 200 OK
- Students table displays 20 seeded students
- Search works
- Pagination works

**Test 4: Role-Based Access**

**For Admin:**
- Can access `/admin` ✅
- Cannot access `/counselor` (redirect to admin) ✅
- Can create/edit/delete students ✅
- Can assign counselors ✅

**For Counselor:**
- Can access `/counselor` ✅
- Cannot access `/admin` (redirect to counselor) ✅
- Can only see assigned students ✅
- Cannot create/delete students ✅

**Test 5: Token Expiry**

- Login
- Clear localStorage manually
- Page should redirect to `/login` ✅

---

## Common Implementation Issues & Solutions

### Issue 1: "Network Error" in frontend
```
Cause: Backend not running or wrong URL in .env.local
Solution:
  1. Check backend running: netstat -ano | findstr ":5000"
  2. Verify REACT_APP_API_URL=http://localhost:5000/api in .env.local
  3. Restart frontend: npm start
```

### Issue 2: "Invalid token" after login
```
Cause: Token not being sent in Authorization header
Solution:
  1. Check api.js interceptor adding Bearer token
  2. Verify localStorage.getItem('token') returns value
  3. Check network tab → Authorization header present
```

### Issue 3: Counselor sees all students instead of assigned
```
Cause: Backend not filtering by assignedCounselor
Solution:
  1. Update backend query in student.controller.js
  2. If user is counselor, filter: { assignedCounselor: userId }
  3. If user is admin, return all students
```

### Issue 4: Button clicks don't work / Modals don't open
```
Cause: Modal state not properly managed or event handlers missing
Solution:
  1. Check onClick handlers bound correctly
  2. Verify state updates: setModalOpen(true/false)
  3. Check form submission preventDefault()
```

---

## File Checklist for Phase 2

```
Frontend/
├── src/
│   ├── pages/
│   │   ├── LoginPage.jsx              ← Login form & auth flow
│   │   ├── AdminDashboard.jsx         ← Admin CRUD interface
│   │   └── CounselorDashboard.jsx     ← Counselor view-only
│   ├── context/
│   │   └── AuthContext.jsx            ← Global auth state
│   ├── services/
│   │   └── api.js                     ← API client with interceptors
│   ├── App.jsx                        ← Route protection & navigation
│   ├── App.css                        ← Styling for dashboards
│   └── index.js                       ← Entry point
├── .env.local                          ← Backend URL configuration
└── package.json                        ← Dependencies

Backend/
├── controllers/
│   ├── auth.controller.js             ← register() / login()
│   └── student.controller.js          ← CRUD + filtering by role
├── routes/
│   ├── auth.routes.js
│   ├── student.routes.js
│   └── dashboard.routes.js
├── middleware/
│   └── auth.middleware.js             ← JWT verification & role check
├── models/
│   ├── user.model.js
│   └── student.model.js
└── server.js                          ← All routes mounted

Database (MongoDB)
├── Users collection                   ← admin, counselor accounts
└── Students collection                ← assignedCounselor reference
```

---

## Success Criteria for Phase 2

- ✅ Login form submits to backend and receives JWT
- ✅ JWT token stored in localStorage
- ✅ Protected routes redirect unauthenticated users to login
- ✅ Admin can view all students and CRUD operations
- ✅ Counselor can view only assigned students
- ✅ Role-based route access enforced
- ✅ API requests include Authorization header
- ✅ Token expiry handled (redirect to login)
- ✅ Error messages displayed to user
- ✅ Search, pagination, filters working
- ✅ Counselor assignment working from admin
- ✅ Status updates working for counselor

---

## Next Phase (Phase 3 Preview)

Once Phase 2 is complete:
- Lead Management (AI scoring)
- Commission Tracking
- WhatsApp/SMS Integration
- Analytics & Reporting
- Deployment to cloud



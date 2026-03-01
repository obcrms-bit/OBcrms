# Education CRM/ERP - Complete Guide

A full-stack Education CRM/ERP system with multi-role support, student management, counselor assignment, and cloud deployment ready.

## 🎯 Project Status: Complete (PARTS A, B, C, D)

- ✅ **PART A**: Student-Counselor Assignment System
- ✅ **PART B**: Search & Pagination
- ✅ **PART C**: React Frontend Dashboard
- ✅ **PART D**: Cloud Deployment Guide

---

## 📋 Quick Start (5 minutes)

### Step 1: Start MongoDB
```bash
mongod
```

### Step 2: Start Backend (Terminal 1)
```bash
cd Backend
npm install
node server.js
```
Expected output:
```
✅ MongoDB Connected Successfully
🚀 Server running on port 5000
```

### Step 3: Start Frontend (Terminal 2)
```bash
cd Frontend
npm install
npm start
```
Application opens at `http://localhost:3000`

### Step 4: Login
Use demo credentials:
- **Admin**: admin@trust.com / admin123
- **Counselor**: counselor@trust.com / counselor123

---

## 📁 Project Structure

```
trust-education-crm-erp/
├── Backend/                          # Node.js/Express API
│   ├── models/
│   │   ├── user.model.js            # User schema (admin, counselor)
│   │   ├── student.model.js         # Student schema with counselor ref
│   │   ├── application.model.js     # Application schema
│   │   ├── Commission.js            # Commission schema
│   │   └── Lead.js                  # Lead schema
│   ├── controllers/
│   │   ├── auth.controller.js       # Register/login
│   │   ├── student.controller.js    # CRUD + search + pagination
│   │   ├── application.controller.js
│   │   └── dashboard.controller.js  # Analytics
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── student.routes.js        # Search, pagination, assign
│   │   ├── application.routes.js
│   │   └── dashboard.routes.js
│   ├── middleware/
│   │   └── auth.middleware.js       # JWT + role-based access
│   ├── utils/
│   │   └── responseHandler.js       # Standardized responses
│   ├── server.js                    # Express app setup
│   ├── package.json
│   └── .env                         # MongoDB URI, JWT_SECRET
│
├── Frontend/                         # React Dashboard
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx        # Authentication
│   │   │   ├── AdminDashboard.jsx   # Admin CRUD interface
│   │   │   └── CounselorDashboard.jsx # Counselor view
│   │   ├── services/
│   │   │   └── api.js               # Axios client
│   │   ├── context/
│   │   │   └── AuthContext.jsx      # Global auth state
│   │   ├── App.jsx                  # Routing
│   │   ├── App.css                  # Styling
│   │   └── index.js                 # Entry point
│   ├── public/
│   │   └── index.html
│   ├── package.json
│   ├── .env.local                   # API URL
│   └── .gitignore
│
├── DEPLOYMENT_GUIDE.md              # Cloud deployment (PART D)
├── README.md                        # This file
└── .github/
    └── copilot-instructions.md      # AI guidelines
```

---

## 🔑 Key Features

### Authentication & Authorization
- ✅ JWT-based authentication
- ✅ Bcrypt password hashing (10 rounds)
- ✅ Role-based access control (admin, counselor)
- ✅ Protected routes with middleware
- ✅ Token auto-refresh via localStorage

### Student Management (PART A & B)
- ✅ Create, read, update, delete students
- ✅ Assign counselors to students
- ✅ Search by name or email (regex-based)
- ✅ Pagination (page, limit)
- ✅ Role-based filtering (counselors see only assigned students)
- ✅ Status tracking (New → Processing → Applied → Visa Approved/Rejected)

### Admin Dashboard (PART C)
- ✅ View analytics (total students, visa approved, applications)
- ✅ Manage all students
- ✅ Assign counselors
- ✅ Search and filter
- ✅ Add new students
- ✅ Delete student records

### Counselor Dashboard (PART C)
- ✅ View assigned students only
- ✅ Update status and notes
- ✅ Search within assignments
- ✅ Paginated view

### Cloud Ready (PART D)
- ✅ MongoDB Atlas integration
- ✅ Railway/Render backend deployment
- ✅ Vercel/Netlify frontend hosting
- ✅ Environment variable configuration
- ✅ CORS setup for production

---

## 🚀 API Endpoints

### Authentication
```
POST   /api/auth/register          Register new user
POST   /api/auth/login             Login and get JWT
```

### Students (Protected Routes)
```
GET    /api/students               Get all students (search, pagination)
GET    /api/students/:id           Get single student
POST   /api/students               Create student (admin only)
PUT    /api/students/:id           Update student
DELETE /api/students/:id           Delete student (admin only)
PUT    /api/students/:id/assign-counselor  Assign counselor (admin only)
```

### Dashboard (Protected Routes)
```
GET    /api/dashboard/stats        Get analytics (admin only)
```

### Query Parameters
```
GET /api/students?page=1&limit=10&search=john
- page: Page number (default: 1)
- limit: Results per page (default: 10)
- search: Search term for name/email
```

---

## 📊 Database Schema

### User
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: Enum ["admin", "counselor"],
  createdAt, updatedAt
}
```

### Student
```javascript
{
  fullName: String (required),
  email: String (unique),
  phone: String,
  countryInterested: String,
  notes: String,
  status: Enum ["New", "Processing", "Applied", "Visa Approved", "Rejected"],
  assignedCounselor: ObjectId (ref: User),
  createdAt, updatedAt
}
```

### Application
```javascript
{
  student: ObjectId (ref: Student),
  universityName: String,
  country: String,
  course: String,
  intake: String,
  tuitionFee: Number,
  status: Enum ["pending", "approved", "rejected"],
  createdAt, updatedAt
}
```

---

## 🔐 Security

### Implemented Security Features
- ✅ JWT token-based authentication
- ✅ Bcrypt password hashing (10 salt rounds)
- ✅ CORS enabled (whitelist production domains)
- ✅ Role-based access control middleware
- ✅ Input validation at controller level
- ✅ MongoDB ObjectId validation
- ✅ Bearer token extraction from headers
- ✅ Case-insensitive role comparison (prevents case-mismatch exploits)

### Environment Variables Protected
- `MONGO_URI` - Database connection string
- `JWT_SECRET` - Token signing key
- `PORT` - Server port
- `NODE_ENV` - Environment indicator

### Recommended for Production
- Add rate limiting (express-rate-limit)
- Add request logging (morgan)
- Add input sanitization (express-validator)
- Enable HTTPS/SSL
- Use helmet middleware for headers
- Implement refresh token rotation

---

## 🧪 Testing Endpoints

### 1. Register Admin
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@trust.com",
    "password": "admin123",
    "role": "admin"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@trust.com",
    "password": "admin123"
  }'
```
Response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "_id": "65abc123...",
      "name": "Admin User",
      "email": "admin@trust.com",
      "role": "admin"
    }
  }
}
```

### 3. Create Student (with token)
```bash
curl -X POST http://localhost:5000/api/students \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "fullName": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "countryInterested": "Canada"
  }'
```

### 4. Search Students
```bash
curl http://localhost:5000/api/students?page=1&limit=10&search=john \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 5. Assign Counselor
```bash
curl -X PUT http://localhost:5000/api/students/STUDENT_ID/assign-counselor \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "counselorId": "COUNSELOR_USER_ID"
  }'
```

### 6. Get Dashboard Stats
```bash
curl http://localhost:5000/api/dashboard/stats \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 📚 Documentation

- **[Backend Architecture](Backend/README.md)** - API design & patterns
- **[Frontend Guide](Frontend/FRONTEND_GUIDE.md)** - React setup & features
- **[Deployment Guide](DEPLOYMENT_GUIDE.md)** - Cloud deployment (PART D)
- **[AI Copilot Instructions](.github/copilot-instructions.md)** - Development patterns

---

## 🌐 Deployment (PART D)

### One-Click Deployment

1. **Database**: MongoDB Atlas (free tier: 512MB)
   - https://www.mongodb.com/cloud/atlas

2. **Backend**: Railway or Render
   - Railway: https://railway.app
   - Render: https://render.com

3. **Frontend**: Vercel or Netlify
   - Vercel: https://vercel.com
   - Netlify: https://netlify.com

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed step-by-step instructions.

### Expected Deployment URLs
- Backend: `https://trust-crm-backend-prod.up.railway.app`
- Frontend: `https://trust-crm-frontend.vercel.app`

---

## 📈 Roadmap - Future Enhancements

- [ ] Lead scoring with AI integration
- [ ] Commission tracking system
- [ ] WhatsApp/SMS automation
- [ ] Advanced reporting & analytics
- [ ] Document management (student files)
- [ ] Email notifications
- [ ] Student self-service portal
- [ ] Counselor performance metrics
- [ ] Multi-branch support
- [ ] Desktop mobile app

---

## 🤝 Development Notes

### Tech Stack
- **Backend**: Node.js 16+, Express 5.2.1, Mongoose 9.2.2
- **Frontend**: React 18.2.0, React Router 6.20.0, Axios 1.6.0
- **Database**: MongoDB (local or MongoDB Atlas)
- **Authentication**: JWT (jsonwebtoken), Bcrypt
- **Styling**: CSS3 with Grid & Flexbox
- **Deployment**: Railway/Render (backend), Vercel/Netlify (frontend)

### Code Patterns

#### Response Format (All Endpoints)
```javascript
// Success
{
  "success": true,
  "message": "Operation completed",
  "data": { /* optional */ }
}

// Error
{
  "success": false,
  "message": "User-friendly error message",
  "error": "Technical details (optional)"
}
```

#### Middleware Pattern
```javascript
router.use(protect);           // Require JWT
router.use(restrict('admin')); // Require role
```

#### Error Handling
```javascript
try {
  // operation
} catch (error) {
  return sendError(res, statusCode, message, error);
}
```

---

## 🐛 Troubleshooting

### MongoDB Connection Fails
```bash
# Check MongoDB is running
mongod

# Verify connection string in .env
MONGO_URI=mongodb://localhost:27017/trust-education
```

### Backend crashes on startup
```bash
# Check logs for specific error
# Common issues:
- PORT already in use: kill process on port 5000
- Missing environment variables: Create .env file
- MongoDB not accessible: Check connection string
```

### Frontend shows blank page
```bash
# Check browser console (F12 → Console)
# Common issues:
- .env.local not set: Create REACT_APP_API_URL
- Backend not accessible: Check CORS
- Port conflict: React default is 3000
```

### Search not working
```bash
# Ensure backend is searching correctly
# GET /api/students?search=term

# Check MongoDB has students created
# Verify email/name fields are indexed
```

### Token expires quickly
```bash
# Check JWT_SECRET is set
# Verify expiry time in auth.controller.js (1 hour default)
```

---

## 📞 Support

For issues or questions:
1. Check [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) troubleshooting section
2. Check [Frontend/FRONTEND_GUIDE.md](Frontend/FRONTEND_GUIDE.md) for frontend-specific issues
3. Review `.env` configuration files
4. Check backend logs: `node server.js`
5. Check browser console (DevTools F12)

---

## 📄 License

This project is part of Education's CRM/ERP system.

---

## ✨ Acknowledgments

Built with best practices in:
- RESTful API design
- JWT authentication
- React component patterns
- MongoDB schema design
- Cloud deployment

---

**Ready to deploy?** → See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

**Need backend setup?** → See [Backend/README.md](Backend/README.md)

**Need frontend help?** → See [Frontend/FRONTEND_GUIDE.md](Frontend/FRONTEND_GUIDE.md)


# React Frontend Setup & Running Guide

## Overview
The React frontend provides two separate dashboards:
- **Admin Dashboard**: Full CRUD for students, assign counselors, view analytics
- **Counselor Dashboard**: View assigned students, update status and notes

## Installation

### Prerequisites
- Node.js v16+ and npm
- Backend server running on `https://obcrms-backend.onrender.com`

### Steps

1. **Navigate to Frontend folder**
   ```bash
   cd Frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file** (already created as `.env.local`)
   The file contains:
   ```
   NEXT_PUBLIC_API_URL=https://obcrms-backend.onrender.com/api
   ```

4. **Start development server**
   ```bash
   npm start
   ```
   The app will open at `http://localhost:3000`

## Running the Application

### Full Stack Setup

**Terminal 1 - Backend:**
```bash
cd Backend
npm install
node server.js
# Output: ✅ MongoDB Connected Successfully
#         🚀 Server running on port 5000
```

**Terminal 2 - Frontend:**
```bash
cd Frontend
npm install
npm start
# Output: Compiled successfully!
#         Local: http://localhost:3000
```

**Terminal 3 - MongoDB (if running locally):**
```bash
mongod
```

## Test User Credentials

### Demo Account 1 (Admin)
- **Email**: admin@seed.com
- **Password**: admin123

### Demo Account 2 (Counselor 1)
- **Email**: counselor1@seed.com
- **Password**: counselor123

### Demo Account 3 (Counselor 2)
- **Email**: counselor2@seed.com
- **Password**: counselor123

**Note**: These credentials are created automatically when you run `npm run seed`

### How to Create Test Accounts (Automated)

1. Start backend server
2. Run seed script to create all test users and students:

```bash
cd Backend
npm run seed
```

This automatically creates:
- 1 Admin account
- 2 Counselor accounts
- 20 test Students (some assigned to counselors)

**Output:**
```
Seed finished. You can now login with the following credentials:
 - Admin: admin@seed.com / admin123
 - Counselor1: counselor1@seed.com / counselor123
 - Counselor2: counselor2@seed.com / counselor123
```

### Manual Account Creation (Optional)

If you prefer to create individual accounts manually:

**Register Admin:**
```
POST https://obcrms-backend.onrender.com/api/auth/register
Content-Type: application/json

{
  "name": "Admin User",
  "email": "admin@test.com",
  "password": "admin123",
  "role": "admin"
}
```

**Register Counselor:**
```
POST https://obcrms-backend.onrender.com/api/auth/register
Content-Type: application/json

{
  "name": "Counselor User",
  "email": "counselor@test.com",
  "password": "counselor123",
  "role": "counselor"
}
```

## Roles & Permissions

### Admin Role
**Permissions:**
- Full access to all students in the system
- Create, read, update, delete students
- Assign counselors to students
- View analytics and statistics
- Access admin-only endpoints
- Cannot delete other admin accounts

**Responsibilities:**
- Manage overall student database
- Distribute workload among counselors
- Monitor system performance and metrics
- Generate reports

### Counselor Role
**Permissions:**
- View only students assigned to them
- Update student status and add notes
- Search within assigned students
- Read-only access to most student fields
- Cannot create or delete students
- Cannot assign counselors

**Responsibilities:**
- Track assigned students' progress
- Update application status through stages
- Maintain student communication records
- Report to admin on student outcomes

## Features

### Admin Dashboard (`/admin`)
- ✅ View analytics dashboard (total students, visa approved count, applications)
- ✅ Manage all students (create, view, update, delete)
- ✅ Assign counselors to students
- ✅ Search students by name or email
- ✅ Paginate results (10 per page)
- ✅ View counselor assignments

### Counselor Dashboard (`/counselor`)
- ✅ View only assigned students
- ✅ Search within assigned students
- ✅ Update student status (New → Processing → Applied → Visa Approved/Rejected)
- ✅ Add notes to student records
- ✅ Paginate results
- ✅ Read-only access to basic student info

### Authentication
- ✅ Login with email and password
- ✅ JWT token stored in localStorage
- ✅ Automatic redirect based on role
- ✅ Protected routes
- ✅ Logout functionality
- ✅ Token included in all API requests

## Project Structure

```
Frontend/
├── public/
│   └── index.html              # HTML entry point
├── src/
│   ├── components/             # Reusable components (empty - extendable)
│   ├── pages/
│   │   ├── LoginPage.jsx       # Login form with authentication
│   │   ├── AdminDashboard.jsx  # Admin dashboard
│   │   └── CounselorDashboard.jsx # Counselor dashboard
│   ├── services/
│   │   └── api.js              # Axios client with API endpoints
│   ├── context/
│   │   └── AuthContext.jsx     # Global auth state & functions
│   ├── App.jsx                 # Main routing component
│   ├── App.css                 # All styling
│   ├── index.js                # React entry point
│   └── index.css               # Global styles
├── .env.local                  # Environment variables
├── .gitignore                  # Git ignore rules
├── package.json                # Dependencies and scripts
└── FRONTEND_GUIDE.md           # This file
```

## API Endpoints Used

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token

### Students (with JWT)
- `GET /api/students?page=1&limit=10&search=""` - Get students with pagination & search
- `GET /api/students/:id` - Get single student
- `POST /api/students` - Create student (admin only)
- `PUT /api/students/:id` - Update student (admin/assigned counselor)
- `DELETE /api/students/:id` - Delete student (admin only)
- `PUT /api/students/:id/assign-counselor` - Assign counselor (admin only)

### Dashboard
- `GET /api/dashboard/stats` - Get analytics (admin only)

## Styling

The application uses CSS Grid and Flexbox for responsive layout with:
- **Color scheme**: Purple/blue accent (#667eea), dark sidebar (#2c3e50)
- **Status badges**: Color-coded by application status
- **Modal dialogs**: For adding/editing students
- **Responsive design**: Adapts to different screen sizes

## Troubleshooting

### "Network Error" when logging in
- Ensure backend is running on port 5000
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Verify MongoDB is connected

### "Invalid token" errors
- Clear localStorage: Open DevTools → Application → Clear all
- Log out and log back in
- Restart frontend server

### Students not appearing for counselor
- Ensure admin has assigned counselor via admin dashboard
- Check student's `assignedCounselor` field in MongoDB

### CORS errors
- Backend has CORS enabled globally
- If issues persist, check backend CORS configuration in `server.js`

## Building for Production

```bash
npm run build
```

Creates optimized production build in `build/` folder, ready for deployment to Vercel, Netlify, or other hosting.

## Next Steps (PART D - Cloud Deployment)

Ready to deploy? See `DEPLOYMENT_GUIDE.md` for:
- Deploying backend to Railway.app or Render
- Deploying frontend to Vercel or Netlify
- MongoDB Atlas setup
- Environment variables configuration


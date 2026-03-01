# Quick Reference - Education CRM

## 🎯 What's Included

- ✅ Full-stack Node.js + React application
- ✅ JWT authentication with roles (admin, counselor)
- ✅ Student CRUD with counselor assignment
- ✅ Search & pagination functionality
- ✅ Role-based access control
- ✅ MongoDB schemas with validation
- ✅ React dashboards (admin & counselor)
- ✅ Cloud deployment ready

---

## 🚀 Get Started in 3 Minutes

### Terminal 1: Start MongoDB
```bash
mongod
```

### Terminal 2: Start Backend
```bash
cd Backend
npm install
node server.js
```
✅ Server running on port 5000

### Terminal 3: Start Frontend
```bash
cd Frontend
npm install
npm start
```
✅ App opens at http://localhost:3000

---

## 🔑 Demo Credentials

**Admin Account**
- Email: `admin@trust.com`
- Password: `admin123`
- Access: All students, analytics, counselor assignment

**Counselor Account**
- Email: `counselor@trust.com`
- Password: `counselor123`
- Access: Assigned students only

---

## 📊 API Quick Reference

| Endpoint | Method | Admin | Counselor | Auth |
|----------|--------|-------|-----------|------|
| /api/auth/register | POST | ✓ | ✓ | No |
| /api/auth/login | POST | ✓ | ✓ | No |
| /api/students | GET | ✓ | ✓* | Yes |
| /api/students | POST | ✓ | ✗ | Yes |
| /api/students/:id | PUT | ✓ | ✓* | Yes |
| /api/students/:id | DELETE | ✓ | ✗ | Yes |
| /api/students/:id/assign-counselor | PUT | ✓ | ✗ | Yes |
| /api/dashboard/stats | GET | ✓ | ✗ | Yes |

*Counselor sees only assigned students

---

## 🔍 Search & Filter Examples

### Search by Name
```
GET /api/students?search=john&page=1&limit=10
```

### Search by Email
```
GET /api/students?search=@gmail.com&page=1&limit=10
```

### Get Page 2
```
GET /api/students?page=2&limit=10
```

### Combined
```
GET /api/students?search=canada&page=1&limit=5
```

---

## 📁 File Structure Quick Reference

```
Backend/
  ├── models/          Mongoose schemas
  ├── controllers/     Business logic
  ├── routes/          API endpoints
  ├── middleware/      Auth & validation
  ├── utils/          Helper functions
  └── server.js       Main entry point

Frontend/
  ├── src/
  │   ├── pages/      Login, dashboards
  │   ├── services/   API client (axios)
  │   ├── context/    Auth state
  │   ├── App.jsx     Routing
  │   └── App.css     Styling
  └── public/         Assets
```

---

## 🔐 Environment Variables

### Backend (.env)
```
MONGO_URI=mongodb://localhost:27017/trust-education
PORT=5000
JWT_SECRET=your_secret_key_here
NODE_ENV=development
```

### Frontend (.env.local)
```
REACT_APP_API_URL=http://localhost:5000/api
```

---

## 📧 Create Test Accounts

```bash
# Register Admin
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin",
    "email": "admin@trust.com",
    "password": "admin123",
    "role": "admin"
  }'

# Register Counselor
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Counselor",
    "email": "counselor@trust.com",
    "password": "counselor123",
    "role": "counselor"
  }'
```

---

## 👥 Assign Students to Counselor

1. Get counselor ID (MongoDB ObjectId)
2. Admin dashboard → Select student → Click "Assign"
3. Enter counselor ObjectId
4. Click "Assign"

Or via API:
```bash
curl -X PUT http://localhost:5000/api/students/STUDENT_ID/assign-counselor \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"counselorId": "COUNSELOR_ID"}'
```

---

## 🎨 Frontend Features

### Admin Dashboard
- 📊 View analytics (students, visa approved, applications)
- ➕ Add new students
- ✏️ Update student info
- 🗑️ Delete students
- 👥 Assign counselors
- 🔍 Search students
- 📄 Paginate results

### Counselor Dashboard
- 👤 View assigned students only
- ✏️ Update status and notes
- 🔍 Search assigned students
- 📄 Paginate results

### Authentication
- 🔐 Login page with JWT
- 💾 Auto-save token to localStorage
- 🔄 Auto-redirect based on role
- 🚪 Logout functionality

---

## ⚙️ Customization

### Change Student Status Options
Edit: `Frontend/src/pages/CounselorDashboard.jsx`
```javascript
<option value="New">New</option>
<option value="Processing">Processing</option>
<option value="Applied">Applied</option>
<option value="Visa Approved">Visa Approved</option>
<option value="Rejected">Rejected</option>
```

### Change Page Size
Edit: `studentAPI.getAllStudents(page, 10, search)` 
Change `10` to desired limit

### Customize Colors
Edit: `Frontend/src/App.css`
```css
--primary-color: #667eea;
--sidebar-color: #2c3e50;
```

---

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| "Cannot connect to MongoDB" | Start mongod in separate terminal |
| "Port 5000 already in use" | Kill process: `lsof -ti:5000 \| xargs kill -9` |
| "Login fails" | Verify user email/password in database |
| "Blank frontend" | Ensure REACT_APP_API_URL is set in .env.local |
| "Counselor sees all students" | Verify assignedCounselor field in Student model |
| "Search not working" | Check students exist with matching names/emails |

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| README_COMPLETE.md | Full project overview |
| Backend/ (implied) | API & database docs |
| Frontend/FRONTEND_GUIDE.md | React setup & features |
| DEPLOYMENT_GUIDE.md | Cloud deployment (PART D) |
| .github/copilot-instructions.md | AI development guidelines |

---

## 🚀 Deploy to Cloud (PART D)

1. **Database**: Create free MongoDB Atlas cluster
2. **Backend**: Deploy to Railway.app or Render
3. **Frontend**: Deploy to Vercel or Netlify
4. **Update URLs**: Set API_URL to deployed backend

See: `DEPLOYMENT_GUIDE.md` for detailed instructions

---

## 📞 Need Help?

1. Check docs in order: README_COMPLETE.md → FRONTEND_GUIDE.md → DEPLOYMENT_GUIDE.md
2. Review `.env` configuration
3. Check backend logs: `node server.js` output
4. Check browser console: F12 → Console
5. Search GitHub for similar issues

---

## ✅ Ready to Deploy?

→ Open `DEPLOYMENT_GUIDE.md` for cloud deployment (PART D)

---

**Last Updated**: 2024 | Fully Complete


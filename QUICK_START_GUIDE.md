# Quick Start Guide - Trust Education CRM

## 🎯 5-Minute Local Setup

### Prerequisites
- Node.js 18+ installed
- MongoDB running locally or MongoDB Atlas account
- Git installed

### Step 1: Clone & Install
```bash
cd your-project-directory

# Backend
cd Backend
npm install

# Frontend
cd Frontend
npm install --legacy-peer-deps
```

### Step 2: Configure Environment
```bash
# Backend
cd Backend
cp .env.example .env
# Edit .env and set:
# - MONGO_URI=mongodb://localhost:27017/trust-education-crm
# - JWT_SECRET=your-secret-key

# Frontend
cd Frontend
cp .env.example .env.local
# Default settings should work
```

### Step 3: Start Services
```bash
# Terminal 1 - Backend
cd Backend
npm start
# You should see: ✅ MongoDB Connected Successfully
#                 🚀 Server running on port 5000

# Terminal 2 - Frontend
cd Frontend
npm run dev
# You should see: ▲ Next.js 14.0.4
#                 - Local: http://localhost:3000
```

### Step 4: Access Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

---

## 🐳 Docker Setup (Recommended for Production)

### One-Command Start
```bash
docker-compose up --build
```

### Stop Services
```bash
docker-compose down
```

### View Logs
```bash
docker-compose logs -f
```

---

## 🚀 Deployment Options

### Option 1: Docker (Recommended)
```bash
./scripts/deployment/deploy-docker.sh prod
```

### Option 2: Railway.app (Easiest)
```bash
./scripts/deployment/deploy-railway.sh
```

### Option 3: Heroku
```bash
./scripts/deployment/deploy-heroku.sh
```

### Option 4: Manual VPS/EC2
1. SSH into server
2. Clone repository
3. Set up environment variables
4. `npm install && npm start` (Backend)
5. `npm install --legacy-peer-deps && npm run build && npm start` (Frontend)

---

## 📊 Testing the APIs

### 1. Health Check
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "healthy",
  "uptime": 123.456,
  "timestamp": "2026-03-17T10:55:42.378Z",
  "mongo": "connected"
}
```

### 2. Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "password":"SecurePass123",
    "firstName":"John",
    "lastName":"Doe",
    "role":"admin"
  }'
```

### 3. Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "password":"SecurePass123"
  }'
```

Response includes JWT token - save for next requests

### 4. List Students
```bash
curl http://localhost:5000/api/students \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🔑 Environment Variables Reference

### Backend (.env)
```env
MONGO_URI=mongodb://localhost:27017/trust-education-crm
JWT_SECRET=your-super-secret-key
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NODE_ENV=development
```

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check if port 5000 is in use
lsof -i :5000  # macOS/Linux
netstat -ano | findstr :5000  # Windows

# MongoDB connection issues
# Verify MONGO_URI in .env
# Test: mongosh "your-mongo-uri"
```

### Frontend build errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
npm run dev
```

### FullCalendar CSS errors
```bash
# Already fixed in globals.css
# If it reappears, ensure imports are:
@import '@fullcalendar/common/index.global.css';
```

### Port 3000 already in use
```bash
# Frontend will automatically use 3001
# Check: http://localhost:3001
```

---

## 📝 Useful Commands

### Development
```bash
# Frontend: Format code
npm run format

# Frontend: Run linter
npm run lint
npm run lint:fix

# Backend: Run in debug mode
NODE_DEBUG=* npm start
```

### Production Build
```bash
# Frontend
npm run build
npm start

# Backend
npm run build 2>/dev/null || echo "No build step needed"
npm start
```

### Database
```bash
# Backup MongoDB
mongodump --uri "your-mongo-uri" --out ./backup

# Restore MongoDB
mongorestore --uri "your-mongo-uri" ./backup
```

---

## 📊 API Endpoints Quick Reference

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Students
- `GET /api/students` - List students
- `POST /api/students` - Create student
- `GET /api/students/:id` - Get student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

### Dashboard
- `GET /api/dashboard` - Get analytics

### Other Resources
- `GET /api/applicants` - Applicants
- `GET /api/leads` - Leads
- `GET /api/invoices` - Invoices
- `GET /api/branches` - Branches
- `GET /api/agents` - Agents
- `GET /api/visa-applications` - Visa applications

---

## 🆘 Getting Help

1. Check `DEPLOYMENT_READINESS.md` for detailed deployment guide
2. See `PRE_DEPLOYMENT_CHECKLIST.md` before going to production
3. Review `.github/copilot-instructions.md` for development guidelines
4. Check application logs: `docker-compose logs -f`

---

## ✅ Next Steps

- [ ] Local setup complete
- [ ] Can access frontend at http://localhost:3000
- [ ] Can call API at http://localhost:5000
- [ ] All tests passing
- [ ] Ready to deploy? Follow `DEPLOYMENT_READINESS.md`

---

**Happy coding! 🎉**

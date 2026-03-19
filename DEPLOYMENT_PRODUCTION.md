# ⚡ PRODUCTION DEPLOYMENT GUIDE

## 🎯 PROJECT STATUS: READY FOR DEPLOYMENT

✅ **Backend (Render)** - Ready to Deploy
✅ **Frontend (Vercel)** - Ready to Deploy
✅ **All Dependencies Fixed**
✅ **Environment Variables Configured**
✅ **ESLint & Build Scripts Verified**

---

## 📋 DEPLOYMENT CHECKLIST

### Pre-Deployment
- [ ] Create accounts on Render.com and Vercel.com
- [ ] Verify MongoDB Atlas credentials are working
- [ ] Generate new JWT_SECRET if needed
- [ ] Connect GitHub repository to both platforms

---

## 🔧 BACKEND DEPLOYMENT (RENDER)

### Step 1: Deploy to Render

1. **Go to Render.com** and sign in
2. **Create New > Web Service**
3. **Connect Repository**
   - Select your GitHub repository
   - Authorize Render to access GitHub

4. **Configure for Backend**
   - **Name**: `trust-education-crm-api`
   - **Environment**: `Node`
   - **Region**: `Oregon (us-west)` or closest to you
   - **Branch**: `main`
   - **Root Directory**: `Backend`
   - **Runtime**: `node-18`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

5. **Add Environment Variables**

   In Render dashboard, add these variables:
   ```
   MONGO_URI=mongodb+srv://obcrms_db_user:OBcrm@123@crmbackend.ahypd1w.mongodb.net/?appName=CRMBACKEND
   JWT_SECRET=whtPXDxhtcwJRn45Vh+qfQ2Ktb3u/oCQfH2WQiq+zm8=
   PORT=5000
   NODE_ENV=production
   FRONTEND_URL=https://your-vercel-app.vercel.app
   ```

6. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Copy the URL (e.g., `https://trust-education-crm-api.onrender.com`)
   - Save this URL for Frontend setup

### Verify Backend Deployment

```bash
# Test API Health
curl https://trust-education-crm-api.onrender.com/health

# Should return:
{
  "status": "healthy",
  "uptime": "...",
  "timestamp": "...",
  "mongo": "connected"
}
```

---

## 🌐 FRONTEND DEPLOYMENT (VERCEL)

### Step 1: Deploy to Vercel

1. **Go to Vercel.com** and sign in with GitHub
2. **Import Project**
   - Select your repository
   - Click Import

3. **Configure for Frontend**
   - **Project Name**: `trust-education-crm`
   - **Framework**: `Next.js`
   - **Root Directory**: `Frontend`
   - **Node Version**: `18.x`

4. **Add Environment Variables**

   In Vercel dashboard, add:
   ```
   NEXT_PUBLIC_API_URL=https://trust-education-crm-api.onrender.com
   NEXT_PUBLIC_APP_NAME=Trust Education CRM
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait for deployment
   - Vercel will automatically build and deploy

### Verify Frontend Deployment

- Open your Vercel URL (e.g., `https://trust-education-crm.vercel.app`)
- Check that API calls work (check Network tab in DevTools)
- Expected: All API requests go to your Render backend

---

## 🚀 LOCAL DEVELOPMENT

### Backend Setup
```bash
cd Backend
npm install
npm run dev
```

Backend runs on: `http://localhost:5000`

Health check:
```bash
curl http://localhost:5000/health
```

### Frontend Setup
```bash
cd Frontend
npm install
npm run dev
```

Frontend runs on: `http://localhost:3000`

### Run Both Together
```bash
npm run dev
```

---

## 📦 DOCKER DEPLOYMENT (OPTIONAL)

If deploying with Docker:

```bash
# Build Image
docker build -t trust-education-crm .

# Run Container
docker run -p 5000:5000 \
  -e MONGO_URI="..." \
  -e JWT_SECRET="..." \
  trust-education-crm
```

---

## 🔑 ENVIRONMENT VARIABLES REFERENCE

### Backend (.env)
```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/db
JWT_SECRET=your-jwt-secret-key
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://your-frontend-url.vercel.app
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com
NEXT_PUBLIC_APP_NAME=Trust Education CRM
NODE_ENV=development
```

---

## 📁 FINAL PROJECT STRUCTURE

```
trust-education-crm-erp/
├── Backend/
│   ├── server.js
│   ├── package.json
│   ├── .env.example
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── services/
│   ├── utils/
│   └── node_modules/
├── Frontend/
│   ├── next.config.js
│   ├── vercel.json
│   ├── package.json
│   ├── .env.example
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── public/
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── node_modules/
├── .gitignore
├── package.json
└── README.md
```

---

## 🛠️ TROUBLESHOOTING

### Backend Won't Connect to MongoDB
- [ ] Verify MongoDB Atlas credentials
- [ ] Check IP whitelist in MongoDB Atlas (allow 0.0.0.0/0 for Render)
- [ ] Ensure MONGO_URI is correct in .env
- [ ] Check MONGO_URI connection string format

### Frontend API Calls Failing
- [ ] Verify NEXT_PUBLIC_API_URL is correct
- [ ] Check CORS settings in Backend
- [ ] Ensure Backend FRONTEND_URL matches your Vercel domain
- [ ] Test Backend directly with curl first

### Build Failures
- [ ] Check Node version (18.x recommended)
- [ ] Clear node_modules: `rm -rf node_modules && npm install`
- [ ] Check package.json for broken dependencies
- [ ] Review build logs in Render/Vercel dashboard

### Port Already in Use (Local Dev)
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Or use different port
PORT=5001 npm run dev
```

---

## 📊 MONITORING

### Render Dashboard
- Navigate to `https://dashboard.render.com`
- View logs in real-time
- Monitor CPU/Memory usage
- Set up alerts for crashes

### Vercel Dashboard
- Navigate to `https://vercel.com/dashboard`
- View deployment history
- Check function logs
- Monitor performance metrics

---

## 🔐 SECURITY CHECKLIST

- [ ] Use strong JWT_SECRET (min 32 chars)
- [ ] MongoDB: Whitelist Render/Vercel IPs only
- [ ] CORS: Restrict to your Vercel domain
- [ ] Enable HTTPS (both platforms do this automatically)
- [ ] Rotate credentials regularly
- [ ] Never commit .env files to Git
- [ ] Use environment variables for all secrets

---

## 📞 DEPLOYMENT SUPPORT

**Render Support**: `https://render.com/support`
**Vercel Support**: `https://vercel.com/support`
**MongoDB Support**: `https://docs.mongodb.com`

---

## ✅ DEPLOYMENT COMPLETED

All systems ready for production deployment!

**Next Steps:**
1. Push code to GitHub
2. Deploy Backend to Render
3. Deploy Frontend to Vercel
4. Test both services
5. Configure custom domains (optional)

Good luck! 🚀

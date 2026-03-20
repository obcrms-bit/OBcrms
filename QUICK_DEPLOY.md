# QUICK DEPLOYMENT REFERENCE

## 📋 Before You Deploy

**Have These Ready:**
- GitHub repository URL
- Render.com account (free tier works)
- Vercel.com account (free tier works)
- MongoDB Atlas account (database already created)

---

## 🚀 DEPLOY BACKEND TO RENDER (5 MINUTES)

### 1. Go to render.com/dashboard

### 2. Create New Web Service
- Click "New +" → "Web Service"
- Select GitHub repo
- Authorize Render → GitHub

### 3. Configure Service
```
Name: trust-education-crm-api
Environment: Node
Region: Oregon (us-west)
Branch: main
Root Directory: Backend          ← IMPORTANT
Build Command: npm install --legacy-peer-deps
Start Command: npm start
```

### 4. Add Environment Variables
In Render dashboard, go to "Environment":
```
MONGO_URI=mongodb+srv://your_mongo_username:your_password@cluster.mongodb.net/?appName=CRMBACKEND
JWT_SECRET=<generate-a-new-secret>
NODE_ENV=production
FRONTEND_URL=https://YOUR-VERCEL-URL.vercel.app
```

### 5. Deploy
- Click "Create Web Service"
- Wait 2-3 minutes
- Copy the URL: `https://your-api-name.onrender.com`

### 6. Test
```bash
curl https://your-api-name.onrender.com/health
```

Expected: `{"status":"healthy","mongo":"connected"}`

---

## 🌐 DEPLOY FRONTEND TO VERCEL (3 MINUTES)

### 1. Go to vercel.com → Import Project

### 2. Select GitHub Repo
- Import your repository
- Authorize Vercel → GitHub

### 3. Configure Project
```
Framework: Next.js
Root Directory: Frontend        ← IMPORTANT
Node Version: 18.x
```

### 4. Add Environment Variables
```
NEXT_PUBLIC_API_URL=https://your-api-name.onrender.com/api
NEXT_PUBLIC_APP_NAME=Trust Education CRM
```

### 5. Deploy
- Click "Deploy"
- Wait 1-2 minutes
- Get your URL: `https://your-app.vercel.app`

### 6. Test
- Open in browser: `https://your-app.vercel.app`
- Check Network tab in DevTools
- Requests should go to `onrender.com`

---

## ✅ VERIFY DEPLOYMENT

### Backend Health Check
```bash
curl https://your-api-name.onrender.com/health
```

### Frontend Test
1. Open `https://your-app.vercel.app`
2. Press F12 (DevTools)
3. Go to Network tab
4. Refresh page
5. Look for API calls to `onrender.com`

---

## 🔄 UPDATE DEPLOYED SERVICES

### Push updates to GitHub
```bash
git add .
git commit -m "Fix: deployment issues"
git push origin main
```

### Render automatically redeploys
- No action needed
- Check dashboard → "Events"

### Vercel automatically redeploys
- No action needed
- Check dashboard → "Deployments"

---

## 📱 Test from Mobile

Once deployed, test on actual devices:
- iPhone/iPad
- Android phone
- Tablet

Replace `localhost` with your Vercel URL in `.env` if testing locally.

---

## 🆘 QUICK FIXES

### "Cannot find module" error in Render
→ Go to Render dashboard → Settings → Clear build cache → Redeploy

### API returns 502 Bad Gateway
→ Backend crashed. Check Render logs for errors.
→ Verify MongoDB connection is working.

### Frontend shows blank page
→ Check browser console for errors
→ Verify NEXT_PUBLIC_API_URL in Vercel env vars

### CORS errors
→ In Backend, update FRONTEND_URL to match your Vercel domain
→ Redeploy Backend

---

## 📊 MONITOR YOUR DEPLOYMENT

### Render Dashboard
- Real-time logs
- Restart service if needed
- View metrics

### Vercel Dashboard  
- Deployment history
- Function logs
- Performance analytics

---

## 🎉 DEPLOYMENT COMPLETE!

Your CRM is now live and production-ready!

**Backend URL**: `https://your-api-name.onrender.com`
**Frontend URL**: `https://your-app.vercel.app`

Share these links with your team! 🚀



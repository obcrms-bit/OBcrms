# 🚀 READY-TO-USE DEPLOYMENT COMMANDS

## Copy & Paste These Commands ↓

---

## STEP 1: Verify Local Setup

### Test Backend Installation & Start
```bash
cd Backend
npm install
npm run dev
```

**Expected Output:**
```
✅ MongoDB Connected Successfully
🚀 Server running on port 5000 [development]
```

### Test Frontend Installation & Build
```bash
cd ../Frontend
npm install
npm run build
npm run dev
```

**Expected Output:**
```
✅ Compiled successfully
▲ Next.js 14.0.4
- Local: http://localhost:3000
```

---

## STEP 2: Deploy Backend to Render

### Login to Render: https://dashboard.render.com

1. Click **"New +"** → **"Web Service"**
2. Select your GitHub repository
3. Authorize Render to access GitHub
4. Fill in form:

```
Name:                  trust-education-crm-api
Environment:           Node
Region:                Oregon (us-west)
Branch:                main
Root Directory:        Backend
Build Command:         npm install
Start Command:         npm start
```

5. Click **"Advanced"** → Add Environment Variables:

```
MONGO_URI=mongodb+srv://obcrms_db_user:OBcrm@123@crmbackend.ahypd1w.mongodb.net/?appName=CRMBACKEND
JWT_SECRET=whtPXDxhtcwJRn45Vh+qfQ2Ktb3u/oCQfH2WQiq+zm8=
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://YOUR_VERCEL_URL.vercel.app
```

6. Click **"Create Web Service"**
7. **Wait 2-3 minutes** for deployment
8. **Copy your API URL**: `https://trust-education-crm-api.onrender.com`

### Verify Backend Deployed

```bash
curl https://trust-education-crm-api.onrender.com/health
```

Should return:
```json
{
  "status": "healthy",
  "mongo": "connected"
}
```

---

## STEP 3: Deploy Frontend to Vercel

### Login to Vercel: https://vercel.com/dashboard

1. Click **"Add New"** → **"Project"**
2. Select your GitHub repository
3. Click **"Import"**
4. Configure Project:

```
Framework:             Next.js
Root Directory:        Frontend
Node Version:          18.x
```

5. Click **"Environment Variables"** and add:

```
NEXT_PUBLIC_API_URL=https://trust-education-crm-api.onrender.com
NEXT_PUBLIC_APP_NAME=Trust Education CRM
```

⚠️ **Replace the URL with your actual Render API URL from Step 2**

6. Click **"Deploy"**
7. **Wait 1-2 minutes** for build to complete
8. Get your Frontend URL from deployment screen

### Verify Frontend Deployed

1. Open your Vercel URL in browser
2. Press **F12** to open DevTools
3. Go to **Network** tab
4. Reload page
5. Check that API calls go to your Render backend
6. Verify no 404 or CORS errors

---

## STEP 4: Post-Deployment Testing

### Test API Endpoints

```bash
# Test health check
curl https://trust-education-crm-api.onrender.com/health

# Test CORS from frontend
curl -H "Origin: https://YOUR_VERCEL_URL.vercel.app" \
  https://trust-education-crm-api.onrender.com/api/students
```

### Test Frontend Features

1. **Open Frontend URL** in browser
2. **Check Dashboard** loads data
3. **Check Leads Pipeline** displays leads
4. **Check Navigation** works properly
5. **Check Network tab** - no CORS errors

---

## STEP 5: Troubleshooting Commands

### If Backend Won't Start

```bash
# Check Render logs
# Go to: https://dashboard.render.com → Logs tab

# Local verification
cd Backend
npm install --save express mongoose cors dotenv
npm run dev
```

### If Frontend Build Fails

```bash
# Check Vercel logs
# Go to: https://vercel.com/dashboard → Deployments

# Local verification
cd Frontend
rm -rf .next node_modules package-lock.json
npm install
npm run build
```

### If API Calls Fail

1. Check CORS error in browser console
2. Verify NEXT_PUBLIC_API_URL in Vercel env vars
3. Update FRONTEND_URL in Render env vars
4. Redeploy both services

```bash
# Quick curl test
curl -X GET "https://YOUR_API_URL/health" \
  -H "Origin: https://YOUR_VERCEL_URL.vercel.app"
```

---

## STEP 6: Monitor & Maintain

### Check Backend Logs (Render)
```
1. Go to: https://dashboard.render.com
2. Click your web service
3. View "Logs" tab
4. Look for errors or issues
```

### Check Frontend Logs (Vercel)
```
1. Go to: https://vercel.com/dashboard
2. Click your project
3. Click "Deployments"
4. View "Function Logs" tab
```

### Restart Services

**Backend (Render):**
```
1. Dashboard → Your service
2. Click "Manual Deploy" → "Deploy latest commit"
3. Or restart: Click "Settings" → "Restart"
```

**Frontend (Vercel):**
```
1. Push new code to GitHub
2. Vercel auto-redeploys automatically
3. Or manually: Click deployment → "Redeploy"
```

---

## 🎯 COPY-PASTE READY ENVIRONMENT VARIABLES

### For Render Dashboard (Backend)

```
MONGO_URI=mongodb+srv://obcrms_db_user:OBcrm@123@crmbackend.ahypd1w.mongodb.net/?appName=CRMBACKEND
JWT_SECRET=whtPXDxhtcwJRn45Vh+qfQ2Ktb3u/oCQfH2WQiq+zm8=
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://YOUR_VERCEL_URL.vercel.app
```

### For Vercel Dashboard (Frontend)

```
NEXT_PUBLIC_API_URL=https://YOUR_RENDER_API_URL.onrender.com
NEXT_PUBLIC_APP_NAME=Trust Education CRM
```

---

## ✅ SUCCESS INDICATORS

### Backend Deployed Successfully When:
- [ ] Health endpoint returns `{"status":"healthy"}`
- [ ] MongoDB shows connected status
- [ ] No crash errors in Render logs
- [ ] Port 5000 is accessible

### Frontend Deployed Successfully When:
- [ ] Website loads in browser
- [ ] Dashboard displays data
- [ ] Network tab shows API calls to backend
- [ ] No CORS errors in console
- [ ] No 404 errors

---

## 🔗 QUICK LINKS

- **Render Dashboard**: https://dashboard.render.com
- **Vercel Dashboard**: https://vercel.com/dashboard
- **MongoDB Atlas**: https://cloud.mongodb.com
- **GitHub**: https://github.com

---

## 📝 IMPORTANT NOTES

1. **After deploying Backend**, get the URL and update it in Vercel env vars
2. **FRONTEND_URL** in Render must match your Vercel deployment URL
3. **Both services MUST be deployed** for the app to work
4. **Wait for deployments** to complete (don't close browser during deploy)
5. **Test thoroughly** before sharing with users

---

## 🆘 SUPPORT

If deployment fails:
1. Check Render/Vercel logs
2. Verify environment variables are correct
3. Ensure GitHub repo is updated
4. Check MongoDB credentials
5. Try manual redeploy

Good luck! 🚀

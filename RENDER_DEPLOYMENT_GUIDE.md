# 🚀 Backend Deployment Guide - Render.com

## Prerequisites
- ✅ GitHub repository with code pushed
- ✅ MongoDB Atlas account (free tier available)
- ✅ Render.com account (free tier available)

---

## Step 1: Prepare MongoDB Atlas

### 1.1 Create MongoDB Database
1. Go to [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
2. Sign up or log in
3. Click "Create a Project"
4. Click "Create a Deployment" → Select **M0 (Free)**
5. Choose cloud provider (AWS recommended)
6. Click "Create"

### 1.2 Create Database User
1. Go to "Database Access" (left sidebar)
2. Click "Add a Database User"
3. Username: `obcrms_db_user`
4. Password: Generate a strong password
5. Click "Create"

### 1.3 Get Connection String
1. Go to "Databases" → Click "Connect"
2. Select "Drivers" → Node.js
3. Copy the connection string
4. Replace `<password>` with your user password
5. Save as `MONGO_URI`

**Example:**
```
mongodb+srv://obcrms_db_user:password@crmbackend.ahypd1w.mongodb.net/?appName=CRMBACKEND
```

---

## Step 2: Deploy Backend to Render

### 2.1 Connect GitHub to Render
1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Click "New +" → "Web Service"
4. Select your GitHub repository: `obcrms-bit/OBcrms`
5. Click "Connect"

### 2.2 Configure Web Service
Fill in the following:

| Field | Value |
|-------|-------|
| **Name** | `trust-education-backend` |
| **Environment** | `Node` |
| **Region** | Choose closest to users |
| **Branch** | `main` |
| **Build Command** | `npm install --legacy-peer-deps && npm run build` |
| **Start Command** | `npm start` |

### 2.3 Add Environment Variables
Click "Advanced" → "Add Environment Variable" for each:

```
MONGO_URI=mongodb+srv://obcrms_db_user:password@crmbackend.ahypd1w.mongodb.net/?appName=CRMBACKEND

JWT_SECRET=Be+f8wmO6YoWep2QGu9ezk3zxRr44z8AyfcW9wUo0ro=

PORT=5000

NODE_ENV=production

FRONTEND_URL=https://your-frontend-name.vercel.app

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

### 2.4 Deploy
1. Click "Create Web Service"
2. Render will build and deploy automatically
3. Wait 2-5 minutes for deployment
4. Check the URL in "Service URL" section

---

## Step 3: Verify Deployment

### 3.1 Check Backend Health
```bash
curl https://your-backend-name.onrender.com/
```

You should see a response from the API.

### 3.2 Test API Connection
```bash
curl https://your-backend-name.onrender.com/api/students
```

You should see a JSON response (possibly with error if no data, but API is responding).

### 3.3 Monitor Logs
- In Render dashboard, go to "Logs" tab
- Watch for any startup errors
- Check for MongoDB connection status

---

## Step 4: Connect Frontend to Backend

### 4.1 Update Vercel Environment Variables
1. Go to Vercel dashboard → Your frontend project
2. Settings → Environment Variables
3. Add/Update:
```
NEXT_PUBLIC_API_URL=https://your-backend-name.onrender.com/api
```

4. Click "Save" and redeploy

### 4.2 Verify Frontend-Backend Connection
1. Open your Vercel frontend URL
2. Go to Network tab in DevTools
3. Try any API call (e.g., login, get students)
4. Check if requests go to your Render backend

---

## Troubleshooting

### Backend not starting?
- **Check Logs**: Go to Render → Logs tab
- **Common issues**:
  - MongoDB connection string incorrect
  - Environment variables not set
  - Port already in use

### "Cannot connect to MongoDB" error?
- Verify `MONGO_URI` environment variable is correct
- Check MongoDB IP whitelist (should allow 0.0.0.0/0)
- Ensure MongoDB user password is correct

### Frontend can't reach backend?
- Check `NEXT_PUBLIC_API_URL` in Vercel settings
- Verify backend is running (check Render logs)
- Check CORS headers in backend server.js

### Deployment keeps failing?
- Check build logs in Render
- Verify all dependencies are in package.json
- Ensure `.env` variables are set

---

## Important Notes

⚠️ **Keep JWT_SECRET secret!** Never commit it to GitHub.

⚠️ **Use strong MongoDB password** - Render can be public.

⚠️ **Enable MongoDB IP Whitelist** - Allow Render's IP range.

✅ **Auto-deploy on push** - Render automatically redeploys when you push to main.

---

## Scaling & Optimization

### Free Tier Limitations
- Free tier services sleep after 15 min inactivity
- Use Paid tier for always-on service

### Free Tier → Paid Tier
1. In Render dashboard, select your service
2. Click "Upgrade" → Choose plan
3. Billing starts immediately

### Environment-Specific URLs
- **Development**: `http://localhost:5000/api`
- **Staging**: `https://staging-backend.onrender.com/api`
- **Production**: `https://production-backend.onrender.com/api`

---

## Monitoring

### Set up alerts for:
- Service crashes
- Deployment failures
- High error rates

### View metrics:
- Go to "Metrics" tab
- Monitor CPU, memory, requests

---

## Next Steps

1. ✅ Deploy backend to Render
2. ✅ Deploy frontend to Vercel
3. ✅ Configure environment variables
4. ✅ Test API connectivity
5. ✅ Monitor logs and metrics
6. 🎯 Go live!

---

**Created**: March 18, 2026
**Status**: Ready for Deployment ✅

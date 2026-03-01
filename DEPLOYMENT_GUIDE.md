# Cloud Deployment Guide - PART D

## Overview
This guide covers deploying the complete Education CRM stack to the cloud:
- **Backend**: Node.js/Express API on Railway or Render
- **Frontend**: React app on Vercel or Netlify
- **Database**: MongoDB Atlas (cloud MongoDB)

## Prerequisites
- GitHub account with repository containing the code
- Credit card (for services with paid tiers, though we'll use free options)

---

## Step 1: Database Setup - MongoDB Atlas

### Create Free MongoDB Cluster

1. **Go to MongoDB Atlas**
   - Visit: https://www.mongodb.com/cloud/atlas
   - Click "Sign Up"
   - Create account with email/password

2. **Create Organization & Project**
   - Click "Create an Organization"
   - Name it: "Education"
   - Create a project: "CRM Backend"

3. **Build a Cluster**
   - Click "Build a Database"
   - Choose "M0 Cluster" (free tier)
   - Select region close to users
   - Click "Create Cluster"
   - Wait 5-10 minutes for provisioning

4. **Create Database User**
   - Go to "Database Access"
   - Click "Add New Database User"
   - Username: `crm_admin`
   - Password: Generate secure password, save it
   - Add builtin roles: `Atlas admin`
   - Click "Create Database User"

5. **Whitelist IP & Get Connection String**
   - Go to "Network Access"
   - Click "Add IP Address"
   - Select "Allow access from anywhere" (0.0.0.0/0) for development
   - Click "Confirm"
   - Go back to cluster, click "Connect"
   - Choose "Drivers" connection
   - Copy connection string (looks like):
     ```
     mongodb+srv://crm_admin:<password>@cluster0.xxxxx.mongodb.net/trust-education?retryWrites=true&w=majority
     ```
   - Replace `<password>` with your actual password

### Example Connection String
```
mongodb+srv://crm_admin:YourPassword123@cluster0.abc123.mongodb.net/trust-education?retryWrites=true&w=majority
```

---

## Step 2: Push Code to GitHub

### Repository Setup

1. **Create GitHub Repository**
   - Go to https://github.com/new
   - Name: `trust-education-crm-erp`
   - Make it public
   - Click "Create repository"

2. **Push your code**
   ```bash
   cd c:\Users\ACER\OneDrive\Documents\Projects\trust-education-crm-erp
   git init
   git add -A
   git commit -m "Initial commit: CRM backend and frontend"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/trust-education-crm-erp.git
   git push -u origin main
   ```

3. **Verify on GitHub**
   - Visit your repo and confirm files are there

---

## Step 3: Deploy Backend to Railway.app

### Option A: Deploy to Railway (Recommended for simplicity)

#### Setup

1. **Visit Railway**
   - Go to https://railway.app
   - Click "Start Project"
   - Link GitHub account

2. **Connect GitHub Repository**
   - Select "Deploy from GitHub repo"
   - Choose your `trust-education-crm-erp` repository
   - Click "Deploy"

3. **Configure Backend Service**
   - Railway will detect it's a Node.js project
   - Go to "Variables" tab
   - Add environment variables:
     ```
     MONGO_URI=mongodb+srv://crm_admin:YourPassword123@cluster0.abc123.mongodb.net/trust-education?retryWrites=true&w=majority
     JWT_SECRET=your_jwt_secret_key_here_make_it_long_and_random
     PORT=5000
     NODE_ENV=production
     ```

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Once done, you'll get a public URL like: `https://trust-crm-backend-prod.up.railway.app`

5. **Verify Backend is Running**
   - Visit: `https://trust-crm-backend-prod.up.railway.app/`
   - Should see: `{"success":true,"message":"API is running!"}`

### Option B: Deploy to Render

If you prefer Render instead:

1. **Visit Render**
   - Go to https://render.com
   - Click "New +" → "Web Service"
   - Connect GitHub

2. **Connect Repository**
   - Select your repository
   - Choose branch: `main`

3. **Configure Service**
   - Name: `trust-crm-backend`
   - Runtime: `Node`
   - Build Command: `npm install`
   - Start Command: `node Backend/server.js`

4. **Add Environment Variables**
   - Add in "Environment":
     ```
     MONGO_URI=mongodb+srv://crm_admin:YourPassword123@cluster0.abc123.mongodb.net/trust-education?retryWrites=true&w=majority
     JWT_SECRET=your_jwt_secret_key_here
     PORT=5000
     NODE_ENV=production
     ```

5. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment (3-5 minutes)

---

## Step 4: Deploy Frontend to Vercel

### Setup

1. **Visit Vercel**
   - Go to https://vercel.com
   - Sign up with GitHub
   - Click "Import Project"

2. **Select Repository**
   - Find and select `trust-education-crm-erp`
   - Click "Import"

3. **Configure Frontend**
   - Framework: React
   - Root Directory: `Frontend`
   - Build Command: `npm run build`
   - Output Directory: `build`

4. **Add Environment Variables**
   - Go to Settings → Environment Variables
   - Add:
     ```
     REACT_APP_API_URL=https://trust-crm-backend-prod.up.railway.app/api
     ```
     (Replace with your actual backend URL)

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - You'll get a public URL like: `https://trust-crm-frontend.vercel.app`

### Alternative: Deploy to Netlify

1. **Visit Netlify**
   - Go to https://netlify.com
   - Sign up with GitHub

2. **Deploy**
   - Click "New site from Git"
   - Select GitHub and repository

3. **Configure Build**
   - Build Command: `cd Frontend && npm run build`
   - Publish Directory: `Frontend/build`

4. **Set Environment Variables**
   - Go to Site settings → Build & deploy → Environment
   - Add `REACT_APP_API_URL`

5. **Deploy**
   - Click "Deploy"

---

## Step 5: Update CORS on Backend

Your backend needs to allow requests from your frontend domain:

1. **Update `Backend/server.js`:**
   ```javascript
   // Change from:
   app.use(cors());
   
   // To:
   const allowedOrigins = [
     'http://localhost:3000',
     'https://trust-crm-frontend.vercel.app',
     'https://your-netlify-domain.netlify.app'
   ];
   
   app.use(cors({
     origin: (origin, callback) => {
       if (!origin || allowedOrigins.includes(origin)) {
         callback(null, true);
       } else {
         callback(new Error('Not allowed by CORS'));
       }
     },
     credentials: true
   }));
   ```

2. **Push changes**
   ```bash
   git add Backend/server.js
   git commit -m "Update CORS for production domains"
   git push
   ```

3. **Backend auto-redeploys** (Railway/Render auto-detect changes)

---

## Step 6: Testing Deployed Application

### Test Backend
```bash
# Public API endpoint
curl https://trust-crm-backend-prod.up.railway.app/

# Register new user
curl -X POST https://trust-crm-backend-prod.up.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Admin","email":"admin@production.com","password":"pass123","role":"admin"}'

# Login
curl -X POST https://trust-crm-backend-prod.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@production.com","password":"pass123"}'
```

### Test Frontend
1. Open: `https://trust-crm-frontend.vercel.app`
2. Login with credentials:
   - Email: `admin@production.com`
   - Password: `pass123`
3. Verify you can:
   - See dashboard stats
   - Create new students
   - Update student status
   - Manage counselor assignments

---

## Step 7: Database Backups & Monitoring

### MongoDB Atlas
- Automatic daily backups for free tier
- View backups at: Atlas → Project → Backup

### Monitoring
- **Railway**: Go to service → Logs tab
- **Render**: Go to service → Logs
- **Vercel**: Go to site → Analytics & Monitoring
- **MongoDB**: Atlas → Monitoring

---

## SSL/HTTPS Configuration

### Already Handled Automatically
- **Railway**: Auto-generates HTTPS certificates
- **Render**: Auto-generates HTTPS certificates
- **Vercel**: Auto-generates HTTPS certificates
- **MongoDB Atlas**: Requires encrypted connections

### Verify HTTPS
```bash
curl -I https://trust-crm-backend-prod.up.railway.app/
```
Look for: `SSL certificate: valid`

---

## Environment Variables Summary

### Backend (.env)
```
MONGO_URI=mongodb+srv://crm_admin:password@cluster0.abc123.mongodb.net/trust-education?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_min_32_chars_recommended
PORT=5000
NODE_ENV=production
```

### Frontend (.env.local)
```
REACT_APP_API_URL=https://trust-crm-backend-prod.up.railway.app/api
```

---

## Costs

| Service | Plan | Cost |
|---------|------|------|
| MongoDB Atlas | M0 Cluster | Free (512MB) |
| Railway | Free Tier | $5 credit/month (usually covers usage) |
| Render | Free Tier | Limited, paid after limits |
| Vercel | Free Tier | Unlimited bandwidth |
| **Total** | | **~$5-10/month** |

---

## Troubleshooting Deployment

### Backend won't deploy
```bash
# Check logs
# Railway: Click service → Logs
# Render: Click service → Logs

# Common issues:
- Missing NODE_ENV=production
- Incorrect MONGO_URI format
- PORT not set to 5000
```

### Frontend shows blank page
```bash
# Check browser console (F12 → Console tab)
# Common issues:
- REACT_APP_API_URL not set
- API_URL points to localhost instead of deployed backend
- Backend not accepting requests (CORS issue)
```

### Database connection fails
```bash
# Verify MongoDB Atlas:
1. Check IP whitelist includes: 0.0.0.0/0
2. Verify connection string includes credentials
3. Test connection in MongoDB Atlas test connection dialog
4. Check database user password doesn't have special chars that need escaping
```

### Token issues
```bash
# Frontend can't authenticate
- Check JWT_SECRET is set on backend
- Clear browser localStorage and try again
- Restart backend service
```

---

## Monitoring & Maintenance

### Daily Tasks
- Check backend logs for errors
- Monitor database storage usage
- Monitor API response times

### Weekly Tasks
- Review user activity
- Check for failed authentications
- Backup critical data

### Monthly Tasks
- Update dependencies: `npm update`
- Review and update environment variables
- Analyze usage metrics

---

## Scaling for Production

When ready to scale:
- **Database**: Upgrade MongoDB to M2 cluster (~$0.08/hour)
- **Backend**: Upgrade Railway/Render to paid tier for more resources
- **Frontend**: No changes needed (Vercel scales automatically)
- **CDN**: Add CloudFlare for edge caching ($20/month)

---

## Next Steps

1. ✅ Set up MongoDB Atlas
2. ✅ Push code to GitHub
3. ✅ Deploy backend to Railway/Render
4. ✅ Deploy frontend to Vercel/Netlify
5. ✅ Test application
6. ⏳ Set up monitoring alerts
7. ⏳ Create backup strategy
8. ⏳ Plan scaling strategy

---

## Support & Resources

- **Railway Docs**: https://docs.railway.app
- **Render Docs**: https://render.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **MongoDB Atlas Docs**: https://docs.atlas.mongodb.com
- **React Deployment**: https://create-react-app.dev/deployment

For additional help, reach out to your deployment provider's support.


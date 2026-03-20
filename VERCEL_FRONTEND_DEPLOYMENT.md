# Vercel Frontend Deployment Guide

## Prerequisites
- Node.js 18+ installed locally
- Vercel account (vercel.com)
- Git repository initialized and pushed to GitHub/GitLab/Bitbucket

## Deployment Steps

### 1. **Local Testing**
```bash
cd Frontend
npm install
npm run build
npm start
```

### 2. **Environment Variables Setup**

In Vercel Dashboard, add these environment variables:

```
NEXT_PUBLIC_API_URL=https://obcrms-backend.onrender.com/api
NEXT_PUBLIC_APP_NAME=Trust Education CRM
NODE_ENV=production
```

This project should point at `https://obcrms-backend.onrender.com/api` unless you intentionally change the deployed backend.

### 3. **Deploy to Vercel**

#### Option A: Using Vercel CLI (Recommended)
```bash
npm install -g vercel
vercel login
cd Frontend
vercel --prod
```

#### Option B: GitHub Integration (Recommended for Auto-Deploy)
1. Push code to GitHub
2. Login to Vercel Dashboard (vercel.com)
3. Click "New Project"
4. Select your GitHub repository
5. Set Root Directory to `Frontend`
6. Add Environment Variables (see Step 2)
7. Deploy

### 4. **Verify Deployment**
- Check Vercel Dashboard for build status
- Test the deployed app at `https://your-app.vercel.app`
- Verify API calls reach the backend correctly

## Build Configuration

- **Framework**: Next.js 14.0.4
- **Node Version**: 18+ (recommended)
- **Build Command**: `npm run build`
- **Install Command**: `npm ci`
- **Output Directory**: `.next`

## Troubleshooting

### Build Fails
- Clear cache: `vercel env pull && npm ci`
- Check Node version matches local
- Verify all dependencies are in package.json

### API Connection Fails
- Verify `NEXT_PUBLIC_API_URL` is set correctly in Vercel dashboard
- Ensure backend is publicly accessible
- Check CORS configuration on backend

### Large Build Issues
- Add `.vercelignore` to exclude unnecessary files ✓ (already added)
- Run `npm run lint` locally to catch errors early
- Use `vercel logs` to debug deployment

## Production Best Practices

✓ Security Headers configured in next.config.js
✓ Environment variables properly scoped
✓ Build optimizations enabled
✓ .vercelignore configured
✓ Node modules excluded from deployment

## Rollback

To rollback to a previous deployment:
1. Go to Vercel Dashboard
2. Select the project
3. Go to "Deployments"
4. Click the previous successful deployment
5. Click "Promote to Production"

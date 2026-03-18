# Complete Deployment Guide - Trust Education CRM

**Last Updated**: March 17, 2026

## 📖 Table of Contents
1. [Pre-Deployment Setup](#pre-deployment-setup)
2. [Platform-Specific Guides](#platform-specific-guides)
3. [Post-Deployment](#post-deployment)
4. [Monitoring & Maintenance](#monitoring--maintenance)
5. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Setup

### 1. Environment Configuration

Create `.env` files for both Backend and Frontend:

#### Backend (.env)
```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/trust-education-crm
JWT_SECRET=<use: openssl rand -base64 32>
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=app-specific-password
```

#### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
NODE_ENV=production
```

### 2. Security Audit
Run through `PRE_DEPLOYMENT_CHECKLIST.md` before deploying

### 3. Database Migration
```bash
mongodump --uri "mongodb+srv://..." --out ./backups/pre-deployment
```

---

## Platform-Specific Guides

### 🌟 Option 1: Docker (Recommended)

**Prerequisites**: Docker, Docker Compose

**Steps**:
1. Update `.env` files
2. Run: `docker-compose -f docker-compose.prod.yml up -d`
3. Verify: `curl http://localhost:5000/health`

---

### 🚀 Option 2: Vercel + Railway (Recommended for Most)

**Frontend on Vercel**:
- Sign up at vercel.com
- Connect GitHub repo
- Set `NEXT_PUBLIC_API_URL` environment variable
- Deploy via GitHub push

**Backend on Railway**:
- Sign up at railway.app
- Create new MongoDB database
- Add Node.js service
- Set environment variables
- Deploy from GitHub

---

### 💻 Option 3: Heroku

**Steps**:
1. `heroku create trust-crm-backend`
2. `heroku config:set MONGO_URI=... JWT_SECRET=...`
3. `git push heroku main`

Repeat for frontend.

---

### ☁️ Option 4: AWS EC2 + MongoDB Atlas

**Steps**:
1. Launch EC2 instance (t3.medium, Ubuntu 22.04)
2. SSH and install: `sudo apt install nodejs npm nginx`
3. Clone repo and configure `.env`
4. Install PM2: `npm install -g pm2`
5. Start services: `pm2 start npm -- start`
6. Configure nginx as reverse proxy
7. Setup SSL with Let's Encrypt

---

### 🆙 Option 5: DigitalOcean App Platform

1. Push code to GitHub
2. Create app.yaml (see documentation)
3. Deploy via DigitalOcean dashboard

---

## Post-Deployment

### 1. Verify Deployment

```bash
curl https://yourdomain.com/health
curl https://yourdomain.com
curl https://yourdomain.com/api/students -H "Authorization: Bearer token"
```

### 2. Test Features
- [ ] Login functionality
- [ ] View students
- [ ] Create/Update/Delete student
- [ ] Dashboard loads
- [ ] Search and pagination work
- [ ] No console errors

### 3. Setup Monitoring
- Enable error tracking (Sentry)
- Setup uptime monitoring (UptimeRobot)
- Configure log aggregation
- Set up alerts for critical errors

---

## Monitoring & Maintenance

### Commands

```bash
# View logs
docker-compose logs -f

# Check database status
mongosh "mongodb+srv://..."

# Monitor resources
docker stats
```

### Schedules
- Daily: Check error logs
- Weekly: Backup database
- Monthly: Security audit and updates

---

## Troubleshooting

### SSL Certificate Issues
```bash
certbot renew
certbot certificates
```

### Database Connection
```bash
mongosh "mongodb+srv://username:password@..."
```

### High Memory Usage
Increase container limits or instance size

### Slow Performance
Enable Redis caching, optimize MongoDB indexes

---

## Rollback Procedure

```bash
docker-compose down
git checkout HEAD~1
docker-compose -f docker-compose.prod.yml up -d
curl https://yourdomain.com/health
```

---

## Support

- **Quick Help**: `QUICK_START_GUIDE.md`
- **Pre-Deploy**: `PRE_DEPLOYMENT_CHECKLIST.md`
- **Readiness**: `DEPLOYMENT_READINESS.md`

**Good luck with deployment! 🚀**

# ✅ PRODUCTION DEPLOYMENT CHECKLIST

## Trust Education CRM/ERP System

**Date**: ******\_\_\_******
**Deployed By**: ******\_\_\_******
**Environment**: ◯ Staging ◯ Production
**Backend URL**: ******\_\_\_******
**Frontend URL**: ******\_\_\_******

---

## Phase 1: Pre-Launch Security Audit (48 Hours Before)

### Secrets & Credentials

- [ ] No hardcoded API keys in source code
- [ ] No database credentials in code
- [ ] No JWT secret in code
- [ ] All `.env.example` files created
- [ ] `.gitignore` includes `.env`
- [ ] Reviewed: Backend/.env (exists but not in git)
- [ ] Reviewed: Frontend/.env.local (exists but not in git)

### Code Quality

- [ ] `npm run quality` passes in Backend
- [ ] `npm run quality` passes in Frontend
- [ ] No console.log statements (except error/warn)
- [ ] No TODO comments in critical sections
- [ ] No commented-out code blocks

### Dependencies

- [ ] All dependencies are secure (npm audit clean)
- [ ] No deprecated packages
- [ ] Node.js version >= 18.x
- [ ] npm version is current
- [ ] `package-lock.json` committed to git

### Security Headers

- [ ] Helmet.js enabled (✅ Verified in server.js)
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] No sensitive data in error messages
- [ ] HTTP/HTTPS validation enabled

---

## Phase 2: Environment Configuration (48 Hours Before)

### Backend Environment Variables

Complete all required variables:

```
Backend/.env Configuration Checklist:

✅ Database
[ ] MONGO_URI = mongodb+srv://[user]:[password]@[cluster].mongodb.net/trust-education-crm
    - Tested connection: _____ (Y/N)
    - Database exists in Atlas: _____ (Y/N)
    - Backups enabled: _____ (Y/N)

✅ Security
[ ] JWT_SECRET = [32+ character string]
    - Generated with crypto: _____ (Y/N)
    - Stored securely: _____ (Y/N)
    - Different from dev secret: _____ (Y/N)

✅ Server
[ ] NODE_ENV = production
[ ] PORT = 5000

✅ Frontend
[ ] FRONTEND_URL = https://yourdomain.com
    - Includes https://:  _____ (Y/N)
    - No trailing slash: _____ (Y/N)
    - Matches actual domain: _____ (Y/N)

✅ Optional But Recommended
[ ] EMAIL_HOST = smtp.gmail.com
[ ] EMAIL_PORT = 587
[ ] EMAIL_USER = your-email@gmail.com
[ ] EMAIL_PASS = app-specific-password
[ ] LOG_LEVEL = info
[ ] REDIS_URL = redis://redis-server:6379 (if using Redis)
```

**Backend Variables Verification:**

```bash
# Run this to verify all variables are set:
node -e "
const required = ['MONGO_URI', 'JWT_SECRET', 'NODE_ENV'];
const missing = required.filter(k => !process.env[k]);
if (missing.length) console.error('⚠️  Missing:', missing);
else console.log('✅ All required variables set');
"
```

### Frontend Environment Variables

```
Frontend/.env.local Configuration:

✅ Required
[ ] NEXT_PUBLIC_API_URL = https://api.yourdomain.com/api
    - Includes https://: _____ (Y/N)
    - Includes /api suffix: _____ (Y/N)
    - No trailing slash: _____ (Y/N)
    - Points to correct backend: _____ (Y/N)

✅ Recommended
[ ] NEXT_PUBLIC_APP_NAME = Trust Education CRM
[ ] NEXT_PUBLIC_APP_VERSION = 1.0.0
[ ] NODE_ENV = production

✅ Optional
[ ] NEXT_PUBLIC_SENTRY_DSN = (for error tracking)
[ ] NEXT_PUBLIC_ANALYTICS_ID = (for analytics)
```

**Environment Variables Verification:**

```bash
# Frontend can be tested without npm:
grep -r "localhost:" . --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx"
# Should return NO hardcoded localhost references
```

---

## Phase 3: Deployment Infrastructure (24 Hours Before)

### Docker & Containerization

```
Docker Setup Verification:

[ ] Backend/Dockerfile exists
    - Uses Node.js 18+: _____ (Y/N)
    - Runs npm ci: _____ (Y/N)
    - Has health check: _____ (Y/N)
    - Exposes port 5000: _____ (Y/N)

[ ] Frontend/Dockerfile exists
    - Uses Node.js 18+: _____ (Y/N)
    - Runs npm run build: _____ (Y/N)
    - Exposes port 3000: _____ (Y/N)

[ ] docker-compose.prod.yml configured
    - Has MongoDB service: _____ (Y/N)
    - Has Backend service: _____ (Y/N)
    - Has Frontend service: _____ (Y/N)
    - All env vars passed: _____ (Y/N)
    - Network configured: _____ (Y/N)
    - Volumes for data persistence: _____ (Y/N)

[ ] Can build Docker images without errors
    Tested with: docker-compose -f docker-compose.prod.yml build _____ (Y/N)

[ ] Can start Docker services without crashes
    Tested with: docker-compose -f docker-compose.prod.yml up -d _____ (Y/N)
    Services status: backend _____ frontend _____ mongodb _____
```

### Database Verification

```
MongoDB Atlas Setup:

[ ] Cluster created at mongodb.com/cloud
    - Cluster name: _____________________
    - Region: _____________________
    - Tier: M0 free or higher: _____ (Y/N)

[ ] Database user created
    - Username: _____________________
    - Password: [STORE SECURELY] _____ (Y/N)
    - Has "Atlas Admin" role: _____ (Y/N)

[ ] IP Whitelist configured
    - Production server IP added: _____ (Y/N)
    - Multiple IPs if needed: _____ (Y/N)
    - NOTE: 0.0.0.0/0 allows all (use with caution)

[ ] Connection string verified
    - Connection: mongodb+srv://[user]:[password]@[cluster].mongodb.net/[database]
    - Tested locally: _____ (Y/N)
    - Tested in Docker: _____ (Y/N)

[ ] Backups enabled in Atlas
    - Automated backups: _____ (Y/N)
    - Daily backup snapshots: _____ (Y/N)
    - Retention period set: _____ (Y/N)
```

### Health Checks

```
Health Check Endpoints (CRITICAL):

Test locally first:
[ ] GET http://localhost:5000/health
    - Status code 200: _____ (Y/N)
    - Response includes mongo status: _____ (Y/N)
    - Uptime displayed: _____ (Y/N)

[ ] GET http://localhost:5000/
    - Status code 200: _____ (Y/N)
    - Message shows environment: _____ (Y/N)

After deployment, test:
[ ] GET https://api.yourdomain.com/health
    - Status code 200: _____ (Y/N)
    - MongoDB connected: _____ (Y/N)

[ ] GET https://yourdomain.com
    - Frontend loads without CORS errors: _____ (Y/N)
    - API calls succeed: _____ (Y/N)
```

---

## Phase 4: Local Testing (24 Hours Before)

### Backend Testing

```bash
# 1. Install dependencies
cd Backend
npm install --legacy-peer-deps

# 2. Create .env file
cp .env.example .env
# Edit with REAL production values

# 3. Run quality checks
npm run quality
# Expected: ✓ All checks pass

# 4. Start server
npm start
# Expected: ✅ MongoDB Connected Successfully
#          🚀 Server running on port 5000 [production]

[ ] Backend starts without errors
[ ] No mongosh connection errors
[ ] Port 5000 is accessible
[ ] Health check returns 200
[ ] All routes mount correctly
```

### Frontend Testing

```bash
# 1. Install dependencies
cd Frontend
npm install --legacy-peer-deps

# 2. Create .env.local
cp .env.example .env.local
# Edit with production API URL

# 3. Run quality checks
npm run quality
# Expected: ✓ ESLint and Prettier checks pass

# 4. Build production version
npm run build
# Expected: Compiles without errors
#           Creates .next/ directory
#           No build warnings for critical issues

# 5. Test production build locally
npm start
# Expected: 🚀 ready - started server on localhost:3000

[ ] Frontend builds successfully
[ ] npm start runs without errors
[ ] http://localhost:3000 loads in browser
[ ] No CORS errors in browser console
[ ] API calls reach backend (check Network tab)
```

### End-to-End Testing

```
Critical User Flows to Test:

Authentication:
[ ] User can register
[ ] User receives confirmation email (if enabled)
[ ] User can log in
[ ] JWT token stored in localStorage
[ ] Logout works correctly

Core Features:
[ ] Can create a new lead (CRM)
[ ] Can view leads list
[ ] Can update lead status
[ ] Can create a student
[ ] Can view student dashboard
[ ] Can access visa applications (if enabled)

API Communication:
[ ] All GET requests complete < 500ms
[ ] All POST requests complete < 1000ms
[ ] Error handling shows user-friendly messages
[ ] No 5xx errors in production logs
```

---

## Phase 5: Pre-Deployment Infrastructure (12 Hours Before)

### Domain Configuration

```
DNS Records:

[ ] yourdomain.com set up
    Type: A or CNAME
    Value: __________________ (your server IP or cloud provider)
    TTL: 3600 seconds

[ ] api.yourdomain.com set up (if using separate domain)
    Type: A or CNAME
    Value: __________________ (your server IP or cloud provider)
    TTL: 3600 seconds

[ ] DNS propagation verified
    Tested with: nslookup yourdomain.com
    All records resolve correctly: _____ (Y/N)
```

### SSL/HTTPS Certificates

```
[ ] SSL certificate installed
    Method:
    ◯ Railway (automatic)
    ◯ Heroku (automatic)
    ◯ Let's Encrypt on VPS
    ◯ Other: _______________

[ ] Certificate valid and not expired
    Expiration date: _______________

[ ] HTTPS working at https://yourdomain.com
    Tested in browser: _____ (Y/N)

[ ] Redirect http → https configured
    http://yourdomain.com → https://yourdomain.com: _____ (Y/N)
```

### Monitoring Setup

```
Status Monitoring:

[ ] UptimeRobot configured (uptimerobot.com)
    - Endpoint: https://api.yourdomain.com/health
    - Frequency: Every 5 minutes
    - Alert email set: _____ (Y/N)

[ ] Error Tracking (Optional but recommended)
    ◯ Sentry: SENTRY_DSN = _________
    ◯ Rollbar: ROLLBAR_TOKEN = _________
    ◯ Airbrake: AIRBRAKE_PROJECT_ID = _________

[ ] Log Aggregation (Optional)
    ◯ Enabled: _____ (Y/N)
    Service: _____________
    API Key: _____________
```

---

## Phase 6: Deployment Execution (Go Live)

### Backup Before Deployment

```
[ ] Create MongoDB backup before deployment
    Command: mongodump --uri "mongodb+srv://..." --out ./backup-pre-deploy
    Backup location: _______________
    Backup size: _______________
    Backup verified: _____ (Y/N)

[ ] Commit all code changes
    git log --oneline -5
    Latest commit: _____________________________

[ ] Create git tag for this release
    Command: git tag -a v1.0.0-prod -m "Production deployment"
    git push origin v1.0.0-prod: _____ (Y/N)
```

### Deployment Steps

**For Railway:**

```
[ ] Verify all environment variables in Railway dashboard
[ ] Trigger deployment (push to GitHub or manual deploy)
[ ] Monitor deployment logs
[ ] Wait for "Deploy successful" message (5-10 minutes)
[ ] Verify services are running:
    - Backend: Green status _____ (Y/N)
    - Frontend: Green status _____ (Y/N)
    - MongoDB: Green status _____ (Y/N)
```

**For Docker/VPS:**

```
[ ] SSH into production server
[ ] Pull latest code: git pull origin main _____ (Y/N)
[ ] Update .env files with new values _____ (Y/N)
[ ] Build Docker images: docker-compose -f docker-compose.prod.yml build _____ (Y/N)
[ ] Stop running services: docker-compose down _____ (Y/N)
[ ] Start services: docker-compose -f docker-compose.prod.yml up -d _____ (Y/N)
[ ] Wait 30 seconds for startup
[ ] Verify services running: docker-compose ps
    - 3 services running (backend, frontend, mongodb) _____ (Y/N)
```

**For Heroku:**

```
[ ] Heroku apps created
    - Backend: trust-crm-backend _____ (Y/N)
    - Frontend: trust-crm-frontend _____ (Y/N)
[ ] Environment variables set: heroku config:set ... _____ (Y/N)
[ ] Deploy: git push heroku main _____ (Y/N)
[ ] Monitor logs: heroku logs -f _____ (Y/N)
[ ] Check dependencies: heroku ps _____ (Y/N)
```

---

## Phase 7: Post-Deployment Verification (Go Live)

### Immediate Verification (First 30 Minutes)

```
CRITICAL - Do NOT skip these:

[ ] Health check passing
    curl https://api.yourdomain.com/health
    Response code: 200 _____ (Y/N)

[ ] Frontend loads
    Open https://yourdomain.com in browser
    Page loads without errors: _____ (Y/N)

[ ] No CORS errors
    Open DevTools (F12) → Console
    No red CORS errors: _____ (Y/N)

[ ] API calls working
    Open DevTools → Network tab
    Login and make API request
    Response: 200 or 201 _____ (Y/N)

[ ] Database connected
    curl https://api.yourdomain.com/health
    mongo status: "connected" _____ (Y/N)

[ ] Error handling works
    Try invalid login
    See user-friendly error message: _____ (Y/N)

[ ] Logs show no crashes
    docker-compose logs backend (no ERROR lines) _____ (Y/N)
    OR
    Heroku logs (no crashes) _____ (Y/N)
    OR
    Application logs (no issues) _____ (Y/N)
```

### Extended Verification (First 1 Hour)

```
[ ] Performance acceptable
    API responses < 500ms: _____ (Y/N)
    Frontend load < 3 seconds: _____ (Y/N)

[ ] Authentication works
    - Register: _____ (Y/N)
    - Login: _____ (Y/N)
    - Logout: _____ (Y/N)
    - Session persists: _____ (Y/N)

[ ] Core workflows tested
    - Create lead: _____ (Y/N)
    - View dashboard: _____ (Y/N)
    - Create student: _____ (Y/N)
    - Update record: _____ (Y/N)

[ ] No database errors
    Backend logs show no MongoDB errors: _____ (Y/N)

[ ] Admin can access
    Admin user logs in: _____ (Y/N)
    Admin dashboard works: _____ (Y/N)
```

### Monitoring Verification (First 24 Hours)

```
[ ] UptimeRobot confirms site up
    Dashboard shows green status: _____ (Y/N)

[ ] No error alerts
    Error tracking service shows 0 errors: _____ (Y/N)

[ ] Performance stable
    Response times consistent: _____ (Y/N)
    No memory leaks: _____ (Y/N)

[ ] No security alerts
    Review security logs: _____ (Y/N)
    No suspicious patterns: _____ (Y/N)

[ ] Team can access
    Can all team members log in: _____ (Y/N)
    Permissions work correctly: _____ (Y/N)
```

---

## Phase 8: Post-Deployment Procedures

### Documentation

```
[ ] Deployment procedure documented
    Location: _______________
    Date deployed: _______________
    Deployed by: _______________
    Deployment time: _______________

[ ] Production credentials stored securely
    Location: (secure password manager)
    Access list: _______________

[ ] Incident response plan shared
    Team members briefed: _____ (Y/N)
    Contact list available: _____ (Y/N)
    Rollback procedure written: _____ (Y/N)
```

### Monitoring & Alerts

```
[ ] Team receives alerts for:
    - Application down: _____ (Y/N)
    - High error rate: _____ (Y/N)
    - Database down: _____ (Y/N)
    - Performance degradation: _____ (Y/N)

[ ] Escalation procedure defined
    First contact: _______________
    Second contact: _______________
    Manager notification: _______________

[ ] On-call schedule created
    Primary on-call: _______________
    Backup on-call: _______________
    Schedule URL: _______________
```

### Rollback Preparation

```
[ ] Rollback plan documented
    Previous version: v0.9.0 / [git commit]
    Rollback time estimate: _____ minutes

[ ] Database rollback tested
    Backup exists: _____ (Y/N)
    Restore procedure verified: _____ (Y/N)
    Restore time estimate: _____ minutes

[ ] Rollback decision authority
    Who decides: _______________
    How quickly: _____ minutes after issue detected
```

---

## Phase 9: First Week Monitoring

### Daily Checks (Monday - Friday)

```
Monday:
[ ] Weekend uptime check - any downtime? _____ (Y/N)
[ ] Error logs review - any patterns? _____ (Y/N)
[ ] Performance metrics - still good? _____ (Y/N)

Tuesday-Thursday:
[ ] Daily health check: _____ (Y/N)
[ ] Error rate < 1%: _____ (Y/N)
[ ] No user complaints: _____ (Y/N)

Friday:
[ ] Week review meeting conducted: _____ (Y/N)
[ ] Any issues documented: _____ (Y/N)
[ ] Team feedback collected: _____ (Y/N)
```

### Issues Found & Fixed

```
Issue #1:
- Description: _________________________________
- Severity: ◯ Critical  ◯ High  ◯ Medium  ◯ Low
- Fix applied: _____ (Y/N)
- Verified: _____ (Y/N)
- Root cause: _________________________________

Issue #2:
- Description: _________________________________
- Severity: ◯ Critical  ◯ High  ◯ Medium  ◯ Low
- Fix applied: _____ (Y/N)
- Verified: _____ (Y/N)
- Root cause: _________________________________
```

---

## Sign-Off

```
☐ All critical checks passed
☐ Application is stable
☐ Monitoring is working
☐ Team is trained
☐ Rollback plan is ready

Deployment Approved By: _______________
Date: _______________
Time: _______________

Witnessed By: _______________
Date: _______________
```

---

## Emergency Contacts

```
On-Call Engineer: _______________  Phone: _______________
Manager: _______________  Phone: _______________
Database Admin: _______________  Phone: _______________
Hosting Provider Support: _______________
Escalation: see incident response plan
```

---

## Quick Reference Links

- **Health Check**: https://api.yourdomain.com/health
- **Frontend**: https://yourdomain.com
- **Admin Logs**: (hosting platform dashboard)
- **Database**: (MongoDB Atlas)
- **Incident Response**: (doc link)
- **Architecture**: See ARCHITECTURE_ELEVATION_GUIDE.md
- **Deployment Guide**: See PRODUCTION_DEPLOYMENT_GUIDE.md

---

**✅ Deployment Complete - System is Live!**

For issues, reference:

- PRODUCTION_DEPLOYMENT_GUIDE.md (Troubleshooting section)
- SENIOR_AUDIT_REPORT.md (Technical details)
- Contact: [Team lead]

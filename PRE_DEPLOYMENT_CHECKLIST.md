# Pre-Deployment Security & Testing Checklist

## 🔒 Security Checklist

### Environment Variables & Secrets
- [ ] All sensitive keys (JWT_SECRET, DB passwords) are in .env and NOT in code
- [ ] .env file is in .gitignore
- [ ] .env.example contains only safe template values
- [ ] No hardcoded credentials in source code
- [ ] Secrets are unique and strong (use `openssl rand -base64 32`)
- [ ] Different secrets for dev/staging/prod environments
- [ ] API keys rotated before deployment

### Database Security
- [ ] MongoDB has authentication enabled (username/password)
- [ ] Database connection uses SSL/TLS in production
- [ ] Database backups are encrypted
- [ ] Backup strategy documented and tested
- [ ] Database user has minimal required permissions
- [ ] Production database is NOT accessible from internet (firewall rules)

### API Security
- [ ] JWT tokens have expiration set (default: 24 hours)
- [ ] CORS is configured for specific origins only (not \*)
- [ ] Rate limiting is enabled on login endpoint
- [ ] API validates all input data
- [ ] SQL injection protection verified (using MongoDB, less risk)
- [ ] XSS protection enabled (Helmet.js configured)
- [ ] CSRF protection enabled for state-changing operations
- [ ] API versioning strategy in place (/api/v1/)

### Frontend Security
- [ ] No API keys or secrets in frontend code
- [ ] HTTPS enforced (redirect HTTP to HTTPS)
- [ ] CSP headers configured properly
- [ ] X-Frame-Options set to DENY or SAMEORIGIN
- [ ] X-Content-Type-Options set to nosniff
- [ ] X-XSS-Protection header present
- [ ] Dependency vulnerabilities checked (`npm audit`)
- [ ] No prototype pollution vulnerabilities

### Infrastructure Security
- [ ] Firewall rules configured to block unauthorized access
- [ ] SSH keys secured and rotated
- [ ] No default credentials used
- [ ] Security group rules follow principle of least privilege
- [ ] DDoS protection enabled (if available on platform)
- [ ] Log access is restricted to authorized personnel
- [ ] Monitoring and alerting configured for suspicious activity

### Deployment Security
- [ ] SSL/TLS certificate configured (not self-signed in production)
- [ ] HTTPS only (no HTTP in production)
- [ ] Secure headers implemented (see Helmet.js config)
- [ ] HSTS enabled (require HTTPS for future connections)
- [ ] Domain/CDN properly configured
- [ ] No debug mode enabled in production
- [ ] Error messages don't expose internal details

---

## 🧪 Functionality Testing

### Backend API Testing

```bash
# 1. Health Check
curl http://localhost:5000/health

# 2. Authentication
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"TestPass123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"TestPass123"}'

# 3. Student Operations
# List students
curl http://localhost:5000/api/students \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create student
curl -X POST http://localhost:5000/api/students \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","phone":"1234567890"}'

# Update student
curl -X PUT http://localhost:5000/api/students/STUDENT_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Doe"}'

# Delete student
curl -X DELETE http://localhost:5000/api/students/STUDENT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"

# 4. Search & Pagination
curl "http://localhost:5000/api/students?search=john&limit=10&skip=0" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 5. Dashboard
curl http://localhost:5000/api/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Frontend Testing

- [ ] Login page loads correctly
- [ ] Login with valid credentials works
- [ ] Login with invalid credentials shows error
- [ ] Dashboard loads and displays data
- [ ] Student list displays all students
- [ ] Can search for students
- [ ] Pagination works correctly
- [ ] Can create new student
- [ ] Can edit student details
- [ ] Can delete student (with confirmation)
- [ ] Forms validate input properly
- [ ] Error messages display correctly
- [ ] Navigation between pages works
- [ ] Responsive design works on mobile
- [ ] No console errors or warnings

### Integration Testing

- [ ] Backend and frontend communicate correctly
- [ ] API responses match expected format
- [ ] Error responses properly handled on frontend
- [ ] Loading states display during API calls
- [ ] Timeouts handled gracefully
- [ ] Network errors show user-friendly messages

---

## 📊 Performance Testing

### Load Testing
- [ ] Backend handles 100 concurrent users
- [ ] Response time under 500ms for normal load
- [ ] Database queries optimized (check MongoDB indexes)
- [ ] Frontend builds in under 2 minutes

### Lighthouse Audit
- [ ] Performance score > 80
- [ ] Accessibility score > 85
- [ ] Best Practices score > 85
- [ ] SEO score > 90

### Bundle Size
- [ ] Frontend bundle size < 500KB (gzipped)
- [ ] No unused dependencies
- [ ] Code splitting implemented

---

## 📝 Code Quality

- [ ] No console.log statements in production code
- [ ] No TODO/FIXME comments left hanging
- [ ] Code follows style guide (ESLint passes)
- [ ] No commented-out code blocks
- [ ] Proper error handling throughout
- [ ] Input validation on all endpoints
- [ ] No hardcoded URLs (use environment variables)
- [ ] Consistent naming conventions

---

## 📚 Documentation

- [ ] README.md updated with deployment instructions
- [ ] API documentation complete
- [ ] Environment variables documented
- [ ] Architecture diagram provided
- [ ] Troubleshooting guide created
- [ ] Database schema documented
- [ ] Setup instructions tested and verified

---

## 🔍 Pre-Deployment Final Checks

### Code Review
- [ ] All changes reviewed by team member
- [ ] No breaking changes without migration plan
- [ ] Backward compatibility maintained
- [ ] Dependencies updated (npm audit)

### Configuration Review
- [ ] All environment variables set correctly
- [ ] Database connection string verified
- [ ] API endpoints configured properly
- [ ] CORS settings reviewed
- [ ] Rate limiting configured

### Backup & Recovery
- [ ] Database backup created before deployment
- [ ] Rollback plan documented
- [ ] Previous version can be restored within 5 minutes

### Monitoring Setup
- [ ] All logs centralized (check logs.json exists)
- [ ] Uptime monitoring configured
- [ ] Error tracking configured (Sentry, etc.)
- [ ] Performance monitoring active
- [ ] Alert rules configured for critical issues

---

## 🚀 Deployment Day Checklist

### Pre-Deployment (1 hour before)
- [ ] Team members notified of deployment time
- [ ] Database backup completed
- [ ] Code frozen (no new commits)
- [ ] All tests passing
- [ ] Monitoring dashboards open and ready

### During Deployment
- [ ] Follow deployment script step-by-step
- [ ] Monitor console output for errors
- [ ] Keep communication channel open
- [ ] Have rollback command ready

### Post-Deployment (1 hour after)
- [ ] All health checks passing: `curl /health`
- [ ] Test critical features manually
- [ ] Monitor logs for errors
- [ ] Check application performance
- [ ] Verify user feedback (Slack, email)

### Post-Deployment (24 hours after)
- [ ] No error spikes in monitoring
- [ ] Database performance normal
- [ ] User reports reviewed
- [ ] System running stable
- [ ] Documentation updated if needed

---

## ⚠️ Rollback Procedure

If deployment fails:

```bash
# 1. Stop current deployment
docker-compose down

# 2. Restore previous version
git checkout previous-version
docker-compose up

# 3. Verify restoration
curl http://localhost:5000/health
curl http://localhost:3000

# 4. Notify team
# Create incident post-mortem
```

---

## 📞 Support & Escalation

- **Critical Issue (Down)**: Immediate rollback
- **Major Bug (Broken feature)**: Hotfix or rollback
- **Minor Bug**: Create ticket for next release
- **Performance Issue**: Investigate and optimize

---

## Sign-Off

- [ ] Security review completed and approved
- [ ] QA testing completed and approved
- [ ] Performance testing completed and approved
- [ ] Business owner approval received
- [ ] Ready to deploy to production

**Deploying by**: _________________ **Date**: _________________

**Reviewed by**: _________________ **Date**: _________________

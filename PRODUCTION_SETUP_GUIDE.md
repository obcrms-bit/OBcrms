# 📋 PRODUCTION SETUP & BEST PRACTICES GUIDE
## Trust Education CRM/ERP

**Date**: March 18, 2026
**Version**: 1.0 (Production Ready)
**Audience**: DevOps, Backend, Frontend Engineers

---

## TABLE OF CONTENTS

1. [Local Development Setup](#local-development-setup)
2. [Production Deployment](#production-deployment)
3. [Code Standards](#code-standards)
4. [API Design Guidelines](#api-design-guidelines)
5. [Database Patterns](#database-patterns)
6. [Security Checklist](#security-checklist)
7. [Performance Optimization](#performance-optimization)
8. [Monitoring & Logging](#monitoring--logging)
9. [Troubleshooting](#troubleshooting)
10. [Post-Launch Improvements](#post-launch-improvements)

---

## LOCAL DEVELOPMENT SETUP

### Prerequisites
```bash
Node.js 18+
MongoDB 7.0+ (or MongoDB Atlas account)
npm/yarn
Docker & Docker Compose (for containerized development)
```

### Quick Start (5 minutes)

#### 1. Clone & Install

```bash
# Backend
cd Backend
npm install

# Frontend
cd Frontend
npm install --legacy-peer-deps
```

#### 2. Configure Environment

```bash
# Backend/.env
MONGO_URI=mongodb://localhost:27017/trust-education-crm
JWT_SECRET=your-dev-secret-key
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NODE_ENV=development
```

#### 3. Start Services

```bash
# Terminal 1: Backend
cd Backend
unset PORT NODE_ENV  # Clear system env vars
npm start

# Terminal 2: Frontend
cd Frontend
npm run dev

# Terminal 3: MongoDB (if running locally)
mongod --dbpath ~/mongodb/data
```

#### 4. Verify

```bash
# Test backend
curl http://localhost:5000/health

# Test frontend
curl http://localhost:3000

# Test API
curl -X GET http://localhost:5000/api/students \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## PRODUCTION DEPLOYMENT

### Pre-Deployment Checklist

- [ ] All environment variables set securely
- [ ] Database backups created
- [ ] SSL/TLS certificates ready
- [ ] Security audit passed (see SENIOR_AUDIT_REPORT.md)
- [ ] Load testing completed
- [ ] Monitoring configured
- [ ] Rollback plan documented

### Deployment Steps (Railway.app - Recommended)

#### 1. Railway Account Setup

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init
```

#### 2. Deploy Backend

```bash
cd Backend
railway link                           # Link to Railway project
railway variables set NODE_ENV=production
railway variables set JWT_SECRET=$(openssl rand -base64 32)
railway variables set MONGO_URI=<your-mongodb-atlas-uri>
railway variables set FRONTEND_URL=https://yourdomain.com
railway up                             # Deploy
```

#### 3. Deploy Frontend

```bash
cd Frontend
railway link                           # Link to Railway project
railway variables set NEXT_PUBLIC_API_URL=https://your-backend-railway.app/api
railway up                             # Deploy
```

#### 4. Configure Domain & SSL

- In Railway dashboard, set custom domain
- SSL automatically provisioned (Let's Encrypt)
- Update DNS records

#### 5. Verify Production

```bash
# Test health
curl https://yourdomain.com/health

# Test API
curl -X GET https://yourdomain.com/api/students \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## CODE STANDARDS

### Naming Conventions

#### Backend
```javascript
// Controllers
function getUserById(req, res) { }         // camelCase
class UserController { }                    // PascalCase

// Models / Database
const UserSchema = mongoose.Schema()        // PascalCase
const user = new User()                     // camelCase instance

// Routes
router.get('/users')                        // lowercase, plural
router.put('/users/:userId')                // lowercase, parameterized
```

#### Frontend
```jsx
// Components
function DashboardCard() { }                // PascalCase
const MyComponent = () => {}                // PascalCase

// Constants
const API_BASE_URL = 'http://...'          // SNAKE_CASE
const DEFAULT_TIMEOUT = 5000                // SNAKE_CASE

// Functions/Variables
function handleClick() { }                  // camelCase
const userData = {}                         // camelCase
```

### File Structure

#### Backend
```
Backend/
├── controllers/nameOfDomain.controller.js
├── routes/nameOfDomain.routes.js
├── models/NameOfDomain.js
├── middleware/authMiddleware.js
├── utils/helpFunction.js
└── validators/nameOfDomain.validator.js
```

#### Frontend
```
Frontend/
├── components/ComponentName/
│   ├── ComponentName.jsx
│   ├── index.js
│   └── style.module.css (if needed)
├── services/apiService.js
├── hooks/useCustomHook.js
└── context/ThemeContext.jsx
```

### Code Comments

**Only add comments for:**
- Complex algorithms
- Non-obvious business logic
- Workarounds and hacks
- Important security decisions

**Don't comment:**
- Self-documenting code
- Standard patterns
- Obvious variable names

```javascript
// ❌ BAD
// Increment counter
counter++

// ✅ GOOD
// Deep pagination check: if count < limit, no more pages exist
const hasMore = data.length === pageSize

// ✅ GOOD (Complex logic)
// Redis cache invalidation: delete by prefix to handle variant keys
// (e.g., "user_123_followers_1", "user_123_followers_2", etc.)
const pattern = `user_${userId}_followers_*`
redis.delPattern(pattern)
```

---

## API DESIGN GUIDELINES

### Request/Response Format

#### Standard Request
```javascript
GET /api/students?limit=10&skip=0&search=john
Host: api.example.com
Authorization: Bearer JWT_TOKEN
Content-Type: application/json
```

#### Standard Response (Success)
```json
{
  "success": true,
  "message": "Students retrieved successfully",
  "data": [
    {
      "_id": "60dbb...",
      "name": "John Doe",
      "email": "john@example.com"
    }
  ],
  "pagination": { "limit": 10, "skip": 0, "total": 150 }
}
```

#### Standard Response (Error)
```json
{
  "success": false,
  "message": "Invalid student ID format",
  "error": "ValidationError",
  "statusCode": 400,
  "details": { "field": "id", "reason": "Must be valid MongoDB ObjectId" }
}
```

### HTTP Status Codes

| Code | Usage | Example |
|------|-------|---------|
| 200 | Success (GET, PUT, PATCH) | Student updated |
| 201 | Created (POST) | New student created |
| 204 | No Content (DELETE) | Student deleted |
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Missing JWT token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Student doesn't exist |
| 409 | Conflict | Email already exists |
| 422 | Unprocessable | Validation failed |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Server Error | Unexpected error |

### Route Structure

```javascript
// POST /api/leads - Create
// GET  /api/leads - List (with pagination)
// GET  /api/leads/:id - Get single
// PUT  /api/leads/:id - Update
// DELETE /api/leads/:id - Delete

// Sub-resources
// POST /api/leads/:id/assign - Assign to agent
// POST /api/leads/:id/status - Update status
// GET /api/leads/:id/activities - Get related activities
```

---

## DATABASE PATTERNS

### Multi-Tenancy Queries

✅ **CORRECT** - Always filter by companyId
```javascript
async getLeadsByCompany(companyId) {
  return Lead.find({ companyId, isActive: true })
    .sort({ createdAt: -1 })
    .limit(10)
}
```

❌ **WRONG** - No company filtering
```javascript
async getLeads() {
  return Lead.find({ isActive: true })  // ❌ Exposes other companies' data!
}
```

### Compound Indexes

✅ **CORRECT** - For multi-tenant queries
```javascript
// In models/Lead.js
schema.index({ companyId: 1, email: 1 })      // For: findByEmail(companyId, email)
schema.index({ companyId: 1, status: 1 })     // For: filterByStatus(companyId)
schema.index({ companyId: 1, createdAt: -1 }) // For: recent leads sorting
```

### Soft Deletes

✅ **CORRECT** - Use isActive flag
```javascript
async deleteLead(id, companyId) {
  return Lead.updateOne(
    { _id: id, companyId },
    { isActive: false, deletedAt: new Date() }
  )
}

// Always filter in queries
Lead.find({ companyId, isActive: true })
```

---

## SECURITY CHECKLIST

### Authentication

- [x] JWT implemented
- [x] Token expiration set (24 hours recommended)
- [x] Refresh token rotation (if applicable)
- [x] Secure password hashing (bcrypt with 10 salt rounds)
- [x] No passwords in logs

### Authorization

- [x] Role-based access control (RBAC)
- [x] Resource ownership verification
- [x] Tenant isolation verified
- [x] Granular permission checks

### Data Protection

- [x] HTTPS/TLS enforced
- [x] Sensitive data encrypted (passwords, SSNs, etc.)
- [x] Secrets never in code or logs
- [x] Rate limiting enabled
- [x] Input validation on all endpoints

### Vulnerability Prevention

- [x] XSS protection (Helmet.js)
- [x] CSRF protection (Helmet.js)
- [x] SQL injection prevention (MongoDB used)
- [x] Command injection prevention (avoid exec)
- [x] XXE prevention (XML processing restricted)

---

## PERFORMANCE OPTIMIZATION

### Backend

```javascript
// ✅ Use pagination
router.get('/leads', async (req, res) => {
  const { limit = 10, skip = 0 } = req.query
  const leads = await Lead.find({ companyId })
    .limit(parseInt(limit))
    .skip(parseInt(skip))
    .lean()  // ← Return plain objects (faster)
})

// ✅ Select only needed fields
const leads = await Lead.find({ companyId })
  .select('name email status')  // ← Only these fields
  .limit(10)

// ✅ Use indexes
schema.index({ companyId: 1, status: 1 })

// ❌ Avoid N+1 queries
// Instead of:
for (let lead of leads) {
  lead.agent = await Agent.findById(lead.agentId)  // ❌ N queries
}

// Do this:
const leads = Lead.find({ companyId }).populate('agentId')  // ✅ 1 query
```

### Frontend

```javascript
// ✅ Use React.memo for expensive components
const StudentCard = React.memo(({ student }) => (
  <div>{student.name}</div>
))

// ✅ Use lazy loading
const ExpensiveChart = React.lazy(() => import('./Charts'))

// ✅ Use debouncing for search
const handleSearch = debounce((query) => {
  fetchStudents(query)
}, 300)

// ✅ Minimize re-renders
const Dashboard = React.memo(() => { ... })
```

---

## MONITORING & LOGGING

### Setup Sentry (Error Tracking)

```javascript
// Backend
const Sentry = require("@sentry/node");

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

app.use(Sentry.Handlers.errorHandler());

// Backend logging
router.get('/leads', async (req, res) => {
  try {
    const leads = await Lead.find()
    res.json(leads)
  } catch (error) {
    Sentry.captureException(error)  // Log to Sentry
    res.status(500).json({ error: 'Internal Server Error' })
  }
})
```

### Setup Structured Logging

```javascript
// Backend - using Winston
const winston = require('winston')

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
})

// Usage
logger.info('Lead created', { leadId: lead._id, companyId: lead.companyId })
logger.error('Database error', { error: err.message, query: query })
```

### Setup Performance Monitoring

```javascript
// Backend - using New Relic or DataDog
const newrelic = require('newrelic')

// Automatically monitors:
// - HTTP requests
// - Database queries
// - External API calls
// - Error rates
// - Response times

// Custom metrics
newrelic.recordMetric('Custom/Leads/Created', 1)
```

---

## TROUBLESHOOTING

### Backend won't start

```bash
# Check environment variables
env | grep -E "MONGO_URI|JWT_SECRET|PORT"

# Check port is not in use
lsof -i :5000

# Check MongoDB connection
mongosh "mongodb://..."

# Check logs
npm start 2>&1 | head -50
```

### Frontend won't build

```bash
# Clear cache
cd Frontend
rm -rf .next node_modules
npm install --legacy-peer-deps

# Build again
npm run build

# Check for TypeScript errors
npx tsc --noEmit
```

### API calls failing

```javascript
// Check CORS
curl -i -X OPTIONS http://localhost:5000/api/leads \
  -H "Origin: http://localhost:3000"

// Check JWT token
const token = localStorage.getItem('token')
console.log(jwt_decode(token))

// Check network
curl -v http://localhost:5000/health
```

### Database slow queries

```javascript
// Enable Mongoose query logging
mongoose.set('debug', true)

// Monitor slow queries
db.setProfilingLevel(1, { slowms: 100 })

// View slow queries
db.system.profile.find({ millis: { $gt: 100 } }).limit(10)
```

---

## POST-LAUNCH IMPROVEMENTS

### Phase 1 (Week 1-2)

#### 1. Add API Documentation (Swagger)

```javascript
// Install
npm install swagger-jsdoc swagger-ui-express

// Usage in routes
/**
 * @swagger
 * /api/leads:
 *   get:
 *     summary: Get all leads
 *     parameters:
 *       - name: limit
 *         in: query
 *         type: integer
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/leads', getLeads)
```

#### 2. Setup Error Tracking (Sentry)

```javascript
npm install @sentry/node
# See "Setup Sentry" section above
```

#### 3. Implement Unit Tests

```bash
npm install --save-dev jest supertest

# Create test file: __tests__/lead.test.js
describe('Lead API', () => {
  test('should create lead', async () => {
    const res = await request(app)
      .post('/api/leads')
      .send({ name: 'John' })
    expect(res.statusCode).toBe(201)
  })
})

# Run tests
npm test
```

### Phase 2 (Week 3-4)

#### 1. Migrate Frontend to TypeScript

```bash
# Convert JSX → TSX
mv Frontend/src/pages/LeadsPage.jsx Frontend/src/pages/LeadsPage.tsx

# Update imports (TypeScript will guide you)
```

#### 2. Add Performance Monitoring

```javascript
// Frontend - Google Lighthouse CI
npm install --save-dev @lhci/cli@*

// Backend - New Relic
npm install newrelic
```

#### 3. Setup Advanced Caching

```javascript
// Backend - Redis
npm install redis

const redis = new Redis(process.env.REDIS_URL)

router.get('/leads', async (req, res) => {
  const cacheKey = `leads:${req.companyId}`
  const cached = await redis.get(cacheKey)

  if (cached) return res.json(JSON.parse(cached))

  const leads = await Lead.find({ companyId })
  await redis.setex(cacheKey, 3600, JSON.stringify(leads))
  res.json(leads)
})
```

---

## QUICK REFERENCE

### Essential Commands

```bash
# Development
npm start                              # Start all services
npm run dev                            # Frontend dev mode
npm run build                          # Frontend production build
npm test                               # Run tests (after setup)

# Database
mongosh "MongoDB URI"                  # Connect to database
db.leads.find({}).limit(10)           # Query data
db.leads.createIndex({companyId: 1})  # Create index

# Deployment
docker-compose up -d                   # Start Docker containers
./scripts/deployment/deploy-docker.sh  # Deploy Docker
./scripts/deployment/deploy-railway.sh # Deploy Railway
./scripts/deployment/deploy-heroku.sh  # Deploy Heroku

# Maintenance
npm audit                              # Check vulnerabilities
npm audit fix                          # Fix vulnerabilities
npm outdated                           # Check outdated packages
npm update                             # Update packages
```

### Environment Variables (Complete Reference)

```bash
# Backend required
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
JWT_SECRET=<32+ char random string>
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com

# Backend optional
SENTRY_DSN=
LOG_LEVEL=info
REDIS_URL=redis://localhost:6379
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=
EMAIL_PASS=

# Frontend required
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
NODE_ENV=production

# Frontend optional
NEXT_PUBLIC_ANALYTICS_ID=
NEXT_PUBLIC_SENTRY_DSN=
```

---

## SUPPORT & RESOURCES

- **Deployment Guide**: See `DEPLOYMENT_INDEX.md`
- **Audit Report**: See `SENIOR_AUDIT_REPORT.md`
- **API Documentation**: See `DEPLOYMENT_READINESS.md` (after Swagger setup)
- **Security Checklist**: See `PRE_DEPLOYMENT_CHECKLIST.md`

---

**Last Updated**: March 18, 2026
**Version**: 1.0 (Production Ready)
**Maintained By**: Senior Software Engineer

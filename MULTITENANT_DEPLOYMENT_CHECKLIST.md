# Multi-Tenant Production Deployment Checklist

## Pre-Deployment Verification

### Database Schema
- [ ] MongoDB indexes created for all compound keys
  ```javascript
  db.users.createIndex({ companyId: 1, email: 1 }, { unique: true })
  db.students.createIndex({ companyId: 1, email: 1 }, { unique: true })
  db.audit_logs.createIndex({ createdAt: 1 }, { expireAfterSeconds: 7776000 })
  ```

- [ ] All models include `companyId` field
- [ ] Soft delete fields added (`deletedAt`)
- [ ] Timestamps enabled on all collections

### API Security
- [ ] `extractTenant` middleware applied to all protected routes
- [ ] `authorize` middleware applied to sensitive operations
- [ ] Rate limiting configured per company
- [ ] CORS configured for production domains
- [ ] JWT expiration set appropriately (1-2 hours)
- [ ] Refresh token mechanism implemented

### Code Quality
- [ ] No hardcoded credentials in code
- [ ] No console.logs in production code
- [ ] Error handling doesn't leak sensitive info
- [ ] Input validation on all endpoints
- [ ] SQL/NoSQL injection prevention verified

### Backend Structure
- [ ] `server.js` configured with correct middleware order
- [ ] Environment variables documented in `.env.example`
- [ ] Database connection pooling configured
- [ ] Error handling middleware in place
- [ ] Request logging enabled (morgan/winston)

---

## Environment Configuration

### .env File Setup

```bash
# CREATE: .env.production
NODE_ENV=production
PORT=5000

# MongoDB
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/trust-education?retryWrites=true&w=majority

# JWT
JWT_SECRET=your-super-secret-key-min-32-chars-long-random-string
JWT_EXPIRE=1h
REFRESH_TOKEN_SECRET=another-super-secret-key-min-32-chars
REFRESH_TOKEN_EXPIRE=7d

# API Configuration
API_TIMEOUT=30000
MAX_REQUEST_SIZE=10mb

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100  # per company

# Email Service (if using)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your-app-password

# Logging
LOG_LEVEL=info
LOG_FILE=/var/log/app.log

# Monitoring
SENTRY_DSN=https://key@sentry.io/project-id
```

### Create .env.example (for team sharing)

```bash
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/trust-education
JWT_SECRET=change-this-in-production
JWT_EXPIRE=1h
# ... (without actual secrets)
```

---

## Database Backup & Recovery

### Backup Strategy

```bash
#!/bin/bash
# backup.sh - Daily automated backup

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/mongodb"

# Full backup
mongodump \
  --uri="mongodb+srv://user:pass@cluster.mongodb.net/trust-education" \
  --out="$BACKUP_DIR/backup_$DATE"

# Compress
tar -czf "$BACKUP_DIR/backup_$DATE.tar.gz" \
  "$BACKUP_DIR/backup_$DATE"

# Upload to S3
aws s3 cp "$BACKUP_DIR/backup_$DATE.tar.gz" \
  s3://your-bucket/backups/

# Keep only last 30 days
find $BACKUP_DIR -type f -mtime +30 -delete

# Notify
echo "Backup completed: backup_$DATE" | mail -s "MongoDB Backup" ops@company.com
```

### Recovery Procedure

```bash
#!/bin/bash
# restore.sh - Restore from backup

BACKUP_FILE=$1
RESTORE_DIR="/tmp/restore"

# Extract backup
tar -xzf "$BACKUP_FILE" -C "$RESTORE_DIR"

# Restore (careful: this overwrites data!)
mongorestore \
  --uri="mongodb+srv://user:pass@cluster.mongodb.net" \
  "$RESTORE_DIR/backup_*"

echo "Restoration complete"
```

### Company-Level Data Export (for GDPR)

```javascript
// export-company-data.js
// Export all data for a specific company (for compliance)

const mongoose = require("mongoose");
const fs = require("fs");

async function exportCompanyData(companyId, outputFile) {
  await mongoose.connect(process.env.MONGO_URI);
  
  const Company = require("./models/Company");
  const User = require("./models/user.model");
  const Student = require("./models/student.model");
  const AuditLog = require("./models/AuditLog");

  const company = await Company.findById(companyId);
  const users = await User.find({ companyId });
  const students = await Student.find({ companyId });
  const auditLogs = await AuditLog.find({ companyId });

  const exportData = {
    exportDate: new Date(),
    company: company.toObject(),
    users: users.map(u => { 
      const obj = u.toObject();
      delete obj.password; // Never export passwords
      return obj;
    }),
    students: students.map(s => s.toObject()),
    auditLogs: auditLogs.map(l => l.toObject()),
  };

  fs.writeFileSync(
    outputFile,
    JSON.stringify(exportData, null, 2)
  );

  console.log(`✅ Exported ${outputFile}`);
  process.exit(0);
}

const companyId = process.argv[2];
exportCompanyData(companyId, `company-export-${companyId}.json`);
```

---

## Monitoring & Observability

### Key Metrics to Track

```javascript
// monitoring.js - Prometheus metrics

const promClient = require("prom-client");

// Request metrics
const httpRequestDuration = new promClient.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
});

// Tenant metrics
const activeTenants = new promClient.Gauge({
  name: "active_tenants",
  help: "Number of active companies",
});

const tenantApiCalls = new promClient.Counter({
  name: "tenant_api_calls_total",
  help: "Total API calls per tenant",
  labelNames: ["companyId", "method", "resource"],
});

// Database metrics
const mongoConnections = new promClient.Gauge({
  name: "mongo_connections",
  help: "Active MongoDB connections",
});

// Error metrics
const authErrors = new promClient.Counter({
  name: "auth_errors_total",
  help: "Total authentication errors",
  labelNames: ["error_type"],
});

module.exports = {
  httpRequestDuration,
  activeTenants,
  tenantApiCalls,
  mongoConnections,
  authErrors,
};
```

### Logging Configuration

```javascript
// logger.js
const winston = require("winston");

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: "trust-education-api",
    environment: process.env.NODE_ENV,
  },
  transports: [
    new winston.transports.File({ 
      filename: "logs/error.log", 
      level: "error" 
    }),
    new winston.transports.File({ filename: "logs/combined.log" }),
    // Production: Send to centralized logging (ELK, Datadog, etc.)
  ],
});

if (process.env.NODE_ENV !== "production") {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

module.exports = logger;
```

### Alert Configuration

```yaml
# alerts.yaml - For your monitoring system (Prometheus, Datadog, etc.)

alerts:
  - name: "Cross-Tenant Data Access"
    condition: "company_a_user_sees_company_b_data"
    severity: "CRITICAL"
    action: "IMMEDIATE_INCIDENT"

  - name: "High Error Rate"
    condition: "error_rate > 5%"
    severity: "HIGH"
    action: "ESCALATE_TO_OPS"

  - name: "Database Connection Failure"
    condition: "mongo_connections == 0"
    severity: "CRITICAL"
    action: "INCIDENT_BRIDGE"

  - name: "Audit Log Lag"
    condition: "audit_log_insert_lag > 5000ms"
    severity: "MEDIUM"
    action: "INVESTIGATE"

  - name: "Unusual API Activity"
    condition: "api_calls_per_company > 10000/hour"
    severity: "MEDIUM"
    action: "REVIEW"
```

---

## Security Hardening

### Helmet.js Configuration

```javascript
// server.js
const helmet = require("helmet");

app.use(helmet());
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    scriptSrc: ["'self'"],
    imgSrc: ["'self'", "data:", "https:"],
  },
}));
app.use(helmet.hsts({ maxAge: 31536000 })); // 1 year
app.use(helmet.frameguard({ action: "deny" }));
app.use(helmet.noSniff());
app.use(helmet.xssFilter());
```

### CORS Configuration

```javascript
// server.js
const cors = require("cors");

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [
  "https://yourdomain.com",
  "https://app.yourdomain.com",
];

app.use(cors({
  origin: (origin, callback) => {
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 3600,
}));
```

### Rate Limiting

```javascript
// server.js
const rateLimit = require("express-rate-limit");

// Global rate limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: "Too many requests, please try again later",
});

// Per-company limiter
const tenantLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  keyGenerator: (req) => req.companyId,
  message: "API rate limit exceeded for your company",
});

// Per-IP auth limiter (prevent brute force)
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 attempts
  skipSuccessfulRequests: true,
  keyGenerator: (req) => req.ip,
  message: "Too many login attempts, try again later",
});

app.use("/api/", globalLimiter);
app.use("/api/protected-routes", tenantLimiter);
app.use("/api/auth/login", authLimiter);
```

---

## Deployment Steps

### 1. Pre-Deployment Testing

```bash
# Run full test suite
npm test

# Test multi-tenant isolation specifically
npm test -- --testNamePattern="multitenant"

# Test security
npm test -- --testNamePattern="security"

# Build/transpile if needed
npm run build
```

### 2. Database Migration

```bash
# Backup current database
./backup.sh

# Run migrations (if using migration tool)
npm run migrate

# Verify indexes
node verify-indexes.js
```

### 3. Deployment

```bash
# For PM2
pm2 deploy ecosystem.config.js production --force

# For Docker
docker build -t trust-education-api .
docker tag trust-education-api registry.yourcompany.com/trust-education-api:latest
docker push registry.yourcompany.com/trust-education-api:latest
kubectl apply -f k8s-deployment.yaml

# For traditional SSH deploy
ssh deploy@production-server 'cd /app && git pull && npm ci && npm restart'
```

### 4. Post-Deployment Verification

```bash
# Check server health
curl https://api.yourdomain.com/health

# Verify MongoDB connection
curl -X GET https://api.yourdomain.com/admin/health \
  -H "Authorization: Bearer super_admin_token"

# Run smoke tests
npm run test:smoke

# Check audit logs
db.audit_logs.count()
```

### 5. Rollback Plan (if needed)

```bash
# Quick rollback
git revert HEAD
npm ci
pm2 restart ecosystem.config.js

# Database rollback
./restore.sh path/to/backup.tar.gz
```

---

## Performance Optimization

### Connection Pooling

```javascript
// config/database.js
const mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_URI, {
  maxPoolSize: 10,      // Connection pool size
  minPoolSize: 5,
  socketTimeoutMS: 45000,
  serverSelectionTimeoutMS: 5000,
  maxIdleTimeMS: 60000,
});
```

### Query Optimization

```javascript
// Use lean() for read-only queries
User.find({ companyId }).lean().limit(10)

// Use projection to limit fields
Student.find({ companyId })
  .select("name email status")
  .limit(10)

// Use aggregation for complex queries
Student.aggregate([
  { $match: { companyId } },
  { $group: { _id: "$status", count: { $sum: 1 } } }
])

// Cache frequently accessed data
const cache = require("redis");
const students = await cache.get(`company_${companyId}_students`);
if (!students) {
  students = await Student.find({ companyId }).lean();
  await cache.set(`company_${companyId}_students`, students, 3600);
}
```

### Caching Strategy

```javascript
// Redis caching layer
const redis = require("redis");
const client = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
});

async function getCachedStudents(companyId) {
  const cacheKey = `students:${companyId}`;
  
  // Try cache first
  const cached = await client.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // Fetch from DB
  const students = await Student.find({ companyId }).lean();
  
  // Store in cache (1 hour TTL)
  await client.setex(cacheKey, 3600, JSON.stringify(students));
  
  return students;
}
```

---

## Disaster Recovery

### RTO/RPO Targets
- **RTO (Recovery Time Objective)**: 1 hour
- **RPO (Recovery Point Objective)**: 15 minutes

### Disaster Scenarios

#### Scenario 1: Single Record Corruption
```bash
# Restore single document from audit log or backup
db.students.deleteOne({ _id: ObjectId("...") })
# Restore from backup
```

#### Scenario 2: Company Data Deleted
```bash
# Restore entire company from backup
./restore.sh path/to/backup.tar.gz
# Notify company administrators
```

#### Scenario 3: Database Server Failure
```bash
# Failover to secondary MongoDB instance
# Update connection string in .env
# Restart application
```

#### Scenario 4: Production Server Down
```bash
# Failover to backup server
# DNS update
# Restart services
# Verify data integrity
```

---

## Compliance Checklist

- [ ] **GDPR**: Data export, deletion, right to be forgotten
  - Implemented in `export-company-data.js`
  - Soft delete maintains audit trail

- [ ] **CCPA**: Data collection consent, opt-out mechanism
  - Terms of service agreed at company registration
  - Contact preferences configurable

- [ ] **SOC 2**: Audit logs, access controls, encryption
  - Audit logs implemented for all actions
  - RBAC enforced
  - HTTPS/TLS for all traffic, password encryption

- [ ] **Encryption**:
  - In Transit: TLS 1.2+ enforced
  - At Rest: MongoDB encryption enabled
  - Passwords: bcrypt with 10+ rounds

- [ ] **Access Control**:
  - JWT-based authentication
  - Role-based authorization
  - IP whitelisting for super admin (optional)

- [ ] **Data Isolation**:
  - Row-level isolation per company
  - Compound indexes prevent cross-tenant access
  - Audit logs verify isolation

---

## Maintenance Windows

### Regular Maintenance Schedule
- **Daily**: Automated backups, log rotation
- **Weekly**: Index health check, performance analysis
- **Monthly**: Security updates, dependency updates
- **Quarterly**: Load testing, disaster recovery drill
- **Annually**: Security audit, architecture review

### Maintenance Announcement Template
```
SCHEDULED MAINTENANCE NOTICE

Date: [Date]
Time: [Start] - [End] UTC
Duration: [X minutes]
Impact: API unavailable during this window

This maintenance is required for:
✓ Security updates
✓ Performance optimization
✓ Database maintenance

We apologize for any inconvenience.
```

---

## Sign-Off Checklist

- [ ] Security review completed
- [ ] Performance testing passed
- [ ] Backup strategy verified
- [ ] Monitoring configured
- [ ] Disaster recovery plan tested
- [ ] Team trained on deployment
- [ ] Documentation updated
- [ ] CEO/CTO approval obtained

---

**Ready for Production Deployment! 🚀**

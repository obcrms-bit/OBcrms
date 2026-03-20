// ==================== 1. LOAD ENV FIRST ====================
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const envCandidates = [
  path.resolve(__dirname, '.env'),
  path.resolve(__dirname, '..', '.env'),
];

let loadedEnvFile = null;
for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    loadedEnvFile = envPath;
    break;
  }
}

// ==================== 2. VALIDATE REQUIRED ENV VARS ====================
const REQUIRED_ENV = ['MONGO_URI', 'JWT_SECRET'];
const missingEnv = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missingEnv.length > 0) {
  console.error(`FATAL: Missing required environment variables: ${missingEnv.join(', ')}`);
  if (loadedEnvFile) {
    console.error(`Loaded environment file: ${loadedEnvFile}`);
  } else {
    console.error('No .env file found in Backend/ or project root.');
  }
  console.error('For Render, set these values in the service dashboard under Environment.');
  process.exit(1);
}

// ==================== 3. REQUIRE DEPENDENCIES ====================
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const { buildOriginList, isOriginAllowed } = require('./utils/origins');

// ==================== 4. GLOBAL ERROR HANDLERS (before anything else) ====================
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  console.error(err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  console.error(err.stack);
  process.exit(1);
});

// ==================== 5. CREATE EXPRESS APP ====================
const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);

// ==================== 6. SET PORT ====================
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PRODUCTION = NODE_ENV === 'production';
const mongoTarget = process.env.MONGO_URI?.split('@')[1]?.split('/')[0] || 'unknown-host';

// ==================== 7. APPLY MIDDLEWARE ====================
app.use(helmet());
app.use(compression());

// CORS: In production, only allow explicitly configured frontend URLs.
const allowedOrigins = buildOriginList();

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      if (isOriginAllowed(origin, allowedOrigins)) {
        return callback(null, true);
      }
      // In dev, allow everything; in prod, strictly enforce
      if (!IS_PRODUCTION) return callback(null, true);
      return callback(new Error(`CORS: Origin ${origin} not allowed`), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Tenant-Id'],
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Use 'combined' format in production for structured logs; 'dev' locally
app.use(morgan(IS_PRODUCTION ? 'combined' : 'dev'));

// ==================== 8. HEALTH CHECK ROUTE (before auth routes) ====================
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Trust Education CRM API Running',
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// ==================== 9. IMPORT ROUTE FILES ====================
const authRoutes = require('./routes/auth.routes');
const studentRoutes = require('./routes/student.routes');
const applicantRoutes = require('./routes/applicant.routes');
const leadRoutes = require('./routes/lead.routes');
const invoiceRoutes = require('./routes/invoice.routes');
const companyRoutes = require('./routes/company.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const branchRoutes = require('./routes/branchRoutes');
const agentRoutes = require('./routes/agent.routes');
const organizationRoutes = require('./routes/organization.routes');
const catalogRoutes = require('./routes/catalog.routes');
const transferRoutes = require('./routes/transfer.routes');
const commissionRoutes = require('./routes/commission.routes');
const notificationRoutes = require('./routes/notification.routes');
const reportRoutes = require('./routes/report.routes');
const platformRoutes = require('./routes/platform.routes');
const publicRoutes = require('./routes/public.routes');
const superAdminRoutes = require('./routes/superAdmin.routes');
const visaRoutes = require('./routes/visa.routes');
const chatRoutes = require('./routes/chat.routes');
const { initSocket } = require('./sockets/chatSocket');
const {
  startReminderScheduler,
  stopReminderSchedulers,
} = require('./services/followUpReminder.service');

// ==================== 10. MOUNT ROUTES ====================
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/applicants', applicantRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/organization', organizationRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/commissions', commissionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/platform', platformRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/super-admin', superAdminRoutes);
app.use('/api/visa-applications', visaRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/visa-applications/:id/workflow', require('./routes/visaWorkflow.routes'));
app.use('/api/visa-applications/:id/checklist', require('./routes/visaChecklist.routes'));
app.use('/api/visa-applications/:id/financial', require('./routes/visaFinancial.routes'));
app.use('/api/visa-applications/:id/interview', require('./routes/visaInterview.routes'));
app.use('/api/visa-applications/:id/risk', require('./routes/visaRisk.routes'));
app.use('/api/visa-applications/:id/export', require('./routes/visaExport.routes'));
app.use('/api/visa-rules', require('./routes/visa.routes')); // alias

// ==================== 11. 404 HANDLER ====================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// ==================== 12. GLOBAL ERROR HANDLER ====================
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('SERVER ERROR:', err);
  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: IS_PRODUCTION ? undefined : err.stack,
  });
});

// ==================== 13. MONGODB CONNECTION & SERVER START ====================
const mongoOptions = {
  serverSelectionTimeoutMS: 10000, // Timeout after 10s if no server found
  socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
};

mongoose
  .connect(process.env.MONGO_URI, mongoOptions)
  .then(() => {
    console.log(`MongoDB target host: ${mongoTarget}`);
    console.log('✅ MongoDB Connected Successfully');
    console.log(`Allowed web origins: ${allowedOrigins.join(', ')}`);
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT} [${NODE_ENV}]`);
    });

    const io = initSocket(server);
    const stopReminderScheduler = startReminderScheduler();

    // Graceful shutdown
    const shutdown = (signal) => {
      console.log(`\n${signal} received. Closing server gracefully...`);
      io.close();
      stopReminderScheduler();
      stopReminderSchedulers();
      server.close(() => {
        console.log('HTTP server closed.');
        mongoose.connection.close(false, () => {
          console.log('MongoDB connection closed.');
          process.exit(0);
        });
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM')); // Render sends SIGTERM
    process.on('SIGINT', () => shutdown('SIGINT')); // Ctrl+C in dev
  })
  .catch((err) => {
    console.error(`MongoDB connection error [${mongoTarget}]`);
    console.error('Name:', err.name);
    if (err.cause?.message) {
      console.error('Cause:', err.cause.message);
    }
    if (err.stack) {
      console.error(err.stack);
    }
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  });

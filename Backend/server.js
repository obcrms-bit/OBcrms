// ==================== 1. LOAD ENV FIRST ====================
require("dotenv").config();

// ==================== 2. VALIDATE REQUIRED ENV VARS ====================
const REQUIRED_ENV = ["MONGO_URI", "JWT_SECRET"];
const missingEnv = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missingEnv.length > 0) {
  console.error(`FATAL: Missing required environment variables: ${missingEnv.join(", ")}`);
  process.exit(1);
}

// ==================== 3. REQUIRE DEPENDENCIES ====================
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const compression = require("compression");

// ==================== 4. GLOBAL ERROR HANDLERS (before anything else) ====================
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  console.error(err.name, err.message);
  console.error(err.stack);
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION! 💥 Shutting down...");
  console.error(err.name, err.message);
  console.error(err.stack);
  process.exit(1);
});

// ==================== 5. CREATE EXPRESS APP ====================
const app = express();

// ==================== 6. SET PORT ====================
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";
const IS_PRODUCTION = NODE_ENV === "production";

// ==================== 7. APPLY MIDDLEWARE ====================
app.use(helmet());
app.use(compression());

// CORS: In production, only allow the configured FRONTEND_URL.
// Credentials + wildcard origin is rejected by browsers, so we must be explicit.
const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL]
  : ["http://localhost:5173", "http://localhost:3000", "http://localhost:5000"];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      // In dev, allow everything; in prod, strictly enforce
      if (!IS_PRODUCTION) return callback(null, true);
      return callback(new Error(`CORS: Origin ${origin} not allowed`), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Use 'combined' format in production for structured logs; 'dev' locally
app.use(morgan(IS_PRODUCTION ? "combined" : "dev"));

// ==================== 8. HEALTH CHECK ROUTE (before auth routes) ====================
app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Trust Education CRM API Running",
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    mongo: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// ==================== 9. IMPORT ROUTE FILES ====================
const authRoutes = require("./routes/auth.routes");
const studentRoutes = require("./routes/student.routes");
const applicantRoutes = require("./routes/applicant.routes");
const leadRoutes = require("./routes/lead.routes");
const invoiceRoutes = require("./routes/invoice.routes");
const companyRoutes = require("./routes/company.routes");
const dashboardRoutes = require("./routes/dashboard.routes");

// ==================== 10. MOUNT ROUTES ====================
app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/applicants", applicantRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/dashboard", dashboardRoutes);

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
  console.error("SERVER ERROR:", err);
  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    error: IS_PRODUCTION ? undefined : err.stack,
  });
});

// ==================== 13. MONGODB CONNECTION & SERVER START ====================
const mongoOptions = {
  serverSelectionTimeoutMS: 10000, // Timeout after 10s if no server found
  socketTimeoutMS: 45000,          // Close sockets after 45s of inactivity
};

mongoose
  .connect(process.env.MONGO_URI, mongoOptions)
  .then(() => {
    console.log("✅ MongoDB Connected Successfully");
    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on port ${PORT} [${NODE_ENV}]`);
    });

    // Graceful shutdown
    const shutdown = (signal) => {
      console.log(`\n${signal} received. Closing server gracefully...`);
      server.close(() => {
        console.log("HTTP server closed.");
        mongoose.connection.close(false, () => {
          console.log("MongoDB connection closed.");
          process.exit(0);
        });
      });
    };

    process.on("SIGTERM", () => shutdown("SIGTERM")); // Render sends SIGTERM
    process.on("SIGINT", () => shutdown("SIGINT"));   // Ctrl+C in dev
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err.message);
    process.exit(1);
  });
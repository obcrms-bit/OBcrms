// ==================== 1. REQUIRE DEPENDENCIES ====================
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const helmet = require("helmet");
const compression = require("compression");

// ==================== 2. CREATE EXPRESS APP ====================
const app = express();

// ==================== 3. SET PORT ====================
const PORT = process.env.PORT || 5000;

// ==================== 4. APPLY MIDDLEWARE ====================
app.use(helmet()); // Security headers
app.use(compression()); // Compress responses
app.use(cors({
  origin: process.env.FRONTEND_URL || "*", // In production, replace with your frontend URL
  credentials: true
}));
app.use(express.json());

// Add request logging (only in non-production or for debugging)
if (process.env.NODE_ENV !== "production") {
  app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.path}`);
    next();
  });
}

// ==================== 4B. IMPORT MIDDLEWARE ====================
const { extractTenant } = require("./middleware/tenant");

// ==================== 5. IMPORT ROUTE FILES ====================
const authRoutes = require("./routes/auth.routes");
const studentRoutes = require("./routes/student.routes");
const applicationRoutes = require("./routes/application.routes");
const leadRoutes = require("./routes/leadRoutes");
const commissionRoutes = require("./routes/commissionRoutes");
const dashboardRoutes = require("./routes/dashboard.routes");

// ==================== 6. MOUNT ROUTES ====================
app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/commissions", commissionRoutes);
app.use("/api/dashboard", dashboardRoutes);

// ==================== 7. HEALTH CHECK ROUTE ====================
app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "API Running",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString()
  });
});

// ==================== 8. 404 HANDLER ====================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint not found",
  });
});

// ==================== 9-10. MONGODB CONNECTION & SERVER START ====================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected Successfully");
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err.message);
    process.exit(1);
  });
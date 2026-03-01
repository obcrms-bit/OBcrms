// ==================== 1. REQUIRE DEPENDENCIES ====================
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

// ==================== 2. CREATE EXPRESS APP ====================
const app = express();

// ==================== 3. SET PORT ====================
const PORT = process.env.PORT || 5000;

// ==================== 4. APPLY MIDDLEWARE ====================
app.use(cors());
app.use(express.json());

// Add request logging
app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.path}`);
  next();
});

// ==================== 4B. IMPORT MIDDLEWARE ====================
const { extractTenant } = require("./middleware/tenant");

// ==================== 5. IMPORT ROUTE FILES ====================
console.log("[DEBUG] Importing auth routes...");
const authRoutes = require("./routes/auth.routes");
console.log("[DEBUG] Auth routes loaded ✅");

console.log("[DEBUG] Importing student routes...");
const studentRoutes = require("./routes/student.routes");
console.log("[DEBUG] Student routes loaded ✅");

const applicationRoutes = require("./routes/application.routes");
const leadRoutes = require("./routes/leadRoutes");
const commissionRoutes = require("./routes/commissionRoutes");
const dashboardRoutes = require("./routes/dashboard.routes");

// ==================== 6. MOUNT ROUTES ====================
console.log("[DEBUG] Mounting auth routes...");
app.use("/api/auth", authRoutes);
console.log("[DEBUG] Auth routes mounted ✅");

console.log("[DEBUG] Mounting student routes...");
app.use("/api/students", studentRoutes);
console.log("[DEBUG] Student routes mounted ✅");

app.use("/api/applications", applicationRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/commissions", commissionRoutes);
app.use("/api/dashboard", dashboardRoutes);

// ==================== 7. TEST ROOT ROUTE ====================
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Trust Education CRM ERP Backend Running 🚀",
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
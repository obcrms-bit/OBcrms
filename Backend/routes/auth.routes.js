const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { extractTenant } = require("../middleware/tenant");
const { authorize } = require("../middleware/authorize");

// ==================== PUBLIC ENDPOINTS ====================
// Company registration - new tenant onboarding (NO middleware needed)
router.post("/register-company", authController.registerCompany);

// Login - any user can login (NO middleware needed)
router.post("/login", authController.login);

// ==================== PROTECTED ENDPOINTS ====================
// Register new user to company (requires extractTenant + admin authorization)
router.post(
  "/register",
  extractTenant,
  authorize(["admin", "super_admin"]),
  authController.register
);

// Logout - any authenticated user
router.post("/logout", extractTenant, authController.logout);

module.exports = router;

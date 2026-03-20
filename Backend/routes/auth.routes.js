const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const {
  enforceLimit,
  protect,
  requirePermission,
} = require('../middleware/AuthMiddleware');

router.post('/register/company', authController.registerCompany);
router.post(
  '/register',
  protect,
  enforceLimit('users'),
  requirePermission('users', 'create'),
  authController.register
);
router.post('/login', authController.login);
router.get('/me', protect, authController.getMe);
router.get(
  '/users',
  protect,
  requirePermission('users', 'view'),
  authController.getCompanyUsers
);

module.exports = router;

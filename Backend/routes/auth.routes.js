const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { protect, restrict } = require('../middleware/AuthMiddleware');

router.post('/register/company', authController.registerCompany);
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authController.getMe);
router.get('/users', protect, restrict('admin', 'manager', 'super_admin'), authController.getCompanyUsers);

module.exports = router;

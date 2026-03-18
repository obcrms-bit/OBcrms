const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { protect, restrict } = require('../middleware/AuthMiddleware');

router.use(protect);
router.get('/stats', restrict('admin', 'manager'), dashboardController.getDashboardStats);

module.exports = router;

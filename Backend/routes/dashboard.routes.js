const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { protect, requirePermission } = require('../middleware/AuthMiddleware');

router.use(protect);
router.get('/stats', requirePermission('dashboards', 'view'), dashboardController.getDashboardStats);

module.exports = router;

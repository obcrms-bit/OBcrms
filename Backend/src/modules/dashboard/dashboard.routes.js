const express = require('express');
const dashboardController = require('./dashboard.controller');
const { protect, requirePermission } = require('../../../middleware/AuthMiddleware');

const router = express.Router();

router.use(protect);
router.get('/stats', requirePermission('dashboards', 'view'), dashboardController.getDashboardStats);

module.exports = router;

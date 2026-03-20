const express = require('express');
const router = express.Router();
const controller = require('../controllers/report.controller');
const {
  protect,
  requireFeature,
  requirePermission,
} = require('../middleware/AuthMiddleware');

router.use(protect);
router.use(requireFeature('reports'));

router.get('/summary', requirePermission('reports', 'view'), controller.getReportSummary);

module.exports = router;

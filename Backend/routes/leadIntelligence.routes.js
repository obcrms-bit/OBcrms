const express = require('express');
const controller = require('../controllers/leadIntelligence.controller');
const { protect, requirePermission } = require('../middleware/AuthMiddleware');

const router = express.Router();

router.use(protect);

router.get('/overview', requirePermission('dashboards', 'view'), controller.getOverview);

router.get('/settings', requirePermission('settings', 'view'), controller.getSettings);
router.put('/settings', requirePermission('settings', 'edit'), controller.updateSettings);

router.get(
  '/country-rules',
  requirePermission('settings', 'view'),
  controller.getCountryRules
);
router.post(
  '/country-rules',
  requirePermission('settings', 'edit'),
  controller.saveCountryRule
);
router.patch(
  '/country-rules/:id',
  requirePermission('settings', 'edit'),
  controller.saveCountryRule
);
router.delete(
  '/country-rules/:id',
  requirePermission('settings', 'edit'),
  controller.deleteCountryRule
);

router.get(
  '/assignment-rules',
  requirePermission('settings', 'view'),
  controller.getAssignmentRules
);
router.post(
  '/assignment-rules',
  requirePermission('settings', 'edit'),
  controller.saveAssignmentRule
);
router.patch(
  '/assignment-rules/:id',
  requirePermission('settings', 'edit'),
  controller.saveAssignmentRule
);
router.delete(
  '/assignment-rules/:id',
  requirePermission('settings', 'edit'),
  controller.deleteAssignmentRule
);

router.get('/leads/:id', requirePermission('leads', 'view'), controller.getLeadProfile);
router.post(
  '/leads/:id/recalculate',
  requirePermission('leads', 'edit'),
  controller.recalculateLead
);
router.post(
  '/leads/:leadId/recommendations/:recommendationId/execute',
  requirePermission('leads', 'assign'),
  controller.executeRecommendation
);

module.exports = router;

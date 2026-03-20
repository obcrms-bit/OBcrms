const express = require('express');
const router = express.Router();
const controller = require('../controllers/organization.controller');
const {
  protect,
  requireFeature,
  requirePermission,
} = require('../middleware/AuthMiddleware');

router.use(protect);

router.get('/summary', requirePermission('settings', 'view'), controller.getOrganizationSummary);
router.get('/roles', requirePermission('roles', 'view'), controller.getRoles);
router.post('/roles', requirePermission('roles', 'edit'), controller.saveRole);
router.get(
  '/permission-bundles',
  requirePermission('permissions', 'view'),
  controller.getPermissionBundles
);
router.post(
  '/permission-bundles',
  requirePermission('permissions', 'edit'),
  controller.savePermissionBundle
);
router.patch('/users/:id', requirePermission('users', 'edit'), controller.updateUserAccess);
router.get('/audit-logs', requirePermission('audit', 'view'), controller.getAuditLogs);
router.get('/sla', requirePermission('sla', 'view'), controller.getSlaConfig);
router.put('/sla', requirePermission('sla', 'edit'), controller.updateSlaConfig);
router.get(
  '/workflows',
  requireFeature('advancedWorkflows'),
  requirePermission('settings', 'view'),
  controller.getCountryWorkflows
);
router.post(
  '/workflows',
  requireFeature('advancedWorkflows'),
  requirePermission('settings', 'edit'),
  controller.saveCountryWorkflow
);
router.get('/subscription', requirePermission('settings', 'view'), controller.getSubscriptionSummary);
router.put('/subscription', requirePermission('settings', 'manage'), controller.updateSubscription);

module.exports = router;

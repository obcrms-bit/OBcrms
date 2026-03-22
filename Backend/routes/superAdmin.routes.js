const express = require('express');
const router = express.Router();
const controller = require('../controllers/superAdmin.controller');
const { protect } = require('../middleware/AuthMiddleware');
const { checkPlatformControlAccess, checkSuperAdmin } = require('../middleware/authorize');

router.use(protect);
router.use(checkSuperAdmin);

router.get('/team', checkPlatformControlAccess('view'), controller.listPlatformTeam);
router.post('/team', checkPlatformControlAccess('manage'), controller.createPlatformTeamUser);
router.patch('/team/:id', checkPlatformControlAccess('manage'), controller.updatePlatformTeamUser);
router.get('/overview', checkPlatformControlAccess('view'), controller.getOverview);
router.get('/tenants', checkPlatformControlAccess('view'), controller.listTenants);
router.post('/tenants', checkPlatformControlAccess('manage'), controller.createTenant);
router.get('/tenants/:id', checkPlatformControlAccess('view'), controller.getTenantDetail);
router.patch('/tenants/:id/status', checkPlatformControlAccess('manage'), controller.updateTenantStatus);
router.put(
  '/tenants/:id/subscription',
  checkPlatformControlAccess('manage'),
  controller.updateTenantSubscription
);
router.post(
  '/tenants/:id/apply-template',
  checkPlatformControlAccess('manage'),
  controller.applyTemplate
);
router.post('/tenants/:id/impersonate', checkPlatformControlAccess('manage'), controller.impersonateTenant);
router.get('/templates', checkPlatformControlAccess('view'), controller.getTemplates);
router.post('/templates', checkPlatformControlAccess('manage'), controller.saveTemplate);
router.get('/billing-plans', checkPlatformControlAccess('view'), controller.getBillingPlans);
router.post('/billing-plans', checkPlatformControlAccess('manage'), controller.saveBillingPlan);
router.get('/audit-logs', checkPlatformControlAccess('view'), controller.getAuditLogs);

module.exports = router;

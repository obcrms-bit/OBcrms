const express = require('express');
const router = express.Router();
const controller = require('../controllers/superAdmin.controller');
const { protect } = require('../middleware/AuthMiddleware');
const { checkSuperAdmin } = require('../middleware/authorize');

router.use(protect);
router.use(checkSuperAdmin);

router.get('/overview', controller.getOverview);
router.get('/tenants', controller.listTenants);
router.post('/tenants', controller.createTenant);
router.get('/tenants/:id', controller.getTenantDetail);
router.patch('/tenants/:id/status', controller.updateTenantStatus);
router.put('/tenants/:id/subscription', controller.updateTenantSubscription);
router.post('/tenants/:id/apply-template', controller.applyTemplate);
router.post('/tenants/:id/impersonate', controller.impersonateTenant);
router.get('/templates', controller.getTemplates);
router.post('/templates', controller.saveTemplate);
router.get('/billing-plans', controller.getBillingPlans);
router.post('/billing-plans', controller.saveBillingPlan);
router.get('/audit-logs', controller.getAuditLogs);

module.exports = router;

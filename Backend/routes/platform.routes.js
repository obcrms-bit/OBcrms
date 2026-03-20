const express = require('express');
const controller = require('../controllers/platform.controller');
const { protect, requireFeature, requirePermission } = require('../middleware/AuthMiddleware');

const router = express.Router();

router.use(protect);

router.get('/branding', requirePermission('branding', 'view'), controller.getBranding);
router.put(
  '/branding',
  requireFeature('customBranding'),
  requirePermission('branding', 'edit'),
  controller.updateBranding
);
router.get('/integrations', requirePermission('integrations', 'view'), controller.getIntegrations);
router.post(
  '/integrations',
  requirePermission('integrations', 'configure'),
  controller.saveIntegration
);
router.get(
  '/automations',
  requireFeature('automations'),
  requirePermission('automations', 'view'),
  controller.getAutomations
);
router.post(
  '/automations',
  requireFeature('automations'),
  requirePermission('automations', 'edit'),
  controller.saveAutomation
);
router.get(
  '/forms',
  requireFeature('publicForms'),
  requirePermission('publicforms', 'view'),
  controller.getPublicForms
);
router.post(
  '/forms',
  requireFeature('publicForms'),
  requirePermission('publicforms', 'edit'),
  controller.savePublicForm
);
router.get(
  '/website-integrations',
  requireFeature('websiteIntegration'),
  requirePermission('websiteintegration', 'view'),
  controller.getWebsiteIntegrations
);
router.post(
  '/website-integrations',
  requireFeature('websiteIntegration'),
  requirePermission('websiteintegration', 'configure'),
  controller.saveWebsiteIntegration
);
router.get(
  '/qr-codes',
  requireFeature('qrForms'),
  requirePermission('qrcodes', 'view'),
  controller.getQRCodes
);
router.post(
  '/qr-codes',
  requireFeature('qrForms'),
  requirePermission('qrcodes', 'generate'),
  controller.createQRCode
);
router.get(
  '/billing',
  requireFeature('billing'),
  requirePermission('billing', 'view'),
  controller.getBillingOverview
);

module.exports = router;

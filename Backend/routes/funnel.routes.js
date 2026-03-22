const express = require('express');
const controller = require('../controllers/funnel.controller');
const { protect, requirePermission } = require('../middleware/AuthMiddleware');

const router = express.Router();

router.use(protect);

router.get('/board', requirePermission('leads', 'view'), controller.getBoard);
router.get('/list', requirePermission('leads', 'view'), controller.getList);
router.get('/analytics', requirePermission('dashboards', 'view'), controller.getAnalytics);

router.get('/settings', requirePermission('settings', 'view'), controller.getSettings);
router.get('/settings/stages', requirePermission('settings', 'view'), controller.getStages);
router.post('/settings/stages', requirePermission('settings', 'edit'), controller.saveStage);
router.patch('/settings/stages/:id', requirePermission('settings', 'edit'), controller.saveStage);
router.post(
  '/settings/stages/reorder',
  requirePermission('settings', 'edit'),
  controller.reorderStages
);

router.get(
  '/settings/lost-reasons',
  requirePermission('settings', 'view'),
  controller.getLostReasons
);
router.post(
  '/settings/lost-reasons',
  requirePermission('settings', 'edit'),
  controller.saveLostReason
);
router.patch(
  '/settings/lost-reasons/:id',
  requirePermission('settings', 'edit'),
  controller.saveLostReason
);

router.get(
  '/settings/automations',
  requirePermission('automations', 'view'),
  controller.getAutomations
);
router.post(
  '/settings/automations',
  requirePermission('automations', 'edit'),
  controller.saveAutomation
);
router.patch(
  '/settings/automations/:id',
  requirePermission('automations', 'edit'),
  controller.saveAutomation
);

router.post('/leads/:id/move', requirePermission('leads', 'edit'), controller.moveLead);
router.post('/bulk/move', requirePermission('leads', 'edit'), controller.bulkMove);
router.post('/bulk/assign', requirePermission('leads', 'assign'), controller.bulkAssign);
router.post('/bulk/transfer', requirePermission('transfers', 'create'), controller.bulkTransfer);

module.exports = router;

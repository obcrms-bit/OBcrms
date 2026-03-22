const express = require('express');
const ctrl = require('./leads.controller');
const { protect, requirePermission } = require('../../../middleware/AuthMiddleware');

const router = express.Router();

router.use(protect);

router.get('/workflows', requirePermission('leads', 'view'), ctrl.getWorkflowOptions);
router.get('/pipeline', requirePermission('leads', 'view'), ctrl.getPipeline);
router.get('/followups/due', requirePermission('followups', 'view'), ctrl.getDueFollowUps);
router.get('/followups', requirePermission('followups', 'view'), ctrl.getFollowUps);
router.get('/followups/summary', requirePermission('dashboards', 'view'), ctrl.getFollowUpDashboardSummary);
router.post('/followups/reminders/run', requirePermission('followups', 'manage'), ctrl.triggerReminderSweep);

router.get('/', requirePermission('leads', 'view'), ctrl.getLeads);
router.post('/', requirePermission('leads', 'create'), ctrl.createLead);
router.get('/:id', requirePermission('leads', 'view'), ctrl.getLeadById);
router.put('/:id', requirePermission('leads', 'edit'), ctrl.updateLead);
router.delete('/:id', requirePermission('leads', 'delete'), ctrl.deleteLead);

router.post('/:id/assign', requirePermission('leads', 'assign'), ctrl.assignCounsellor);
router.get('/:id/assignments', requirePermission('leads', 'view'), ctrl.getAssignments);
router.post('/:id/assignments', requirePermission('leads', 'assign'), ctrl.saveAssignments);
router.delete(
  '/:id/assignments/:assignmentId',
  requirePermission('leads', 'assign'),
  ctrl.removeAssignment
);
router.post('/:id/status', requirePermission('leads', 'edit'), ctrl.updateStatus);
router.post('/:id/followup', requirePermission('followups', 'create'), ctrl.scheduleFollowUp);
router.get('/:id/followups', requirePermission('followups', 'view'), ctrl.getLeadFollowUps);
router.post(
  '/:id/followups/:followUpId/complete',
  requirePermission('followups', 'complete'),
  ctrl.completeFollowUp
);
router.post('/:id/note', requirePermission('leads', 'comment'), ctrl.addNote);
router.post('/:id/convert', requirePermission('leads', 'convert'), ctrl.convertToStudent);
router.post('/:id/score', requirePermission('leads', 'edit'), ctrl.recalculateScore);
router.post('/:id/ownership-lock', requirePermission('leads', 'lock'), ctrl.lockOwnership);
router.delete('/:id/ownership-lock', requirePermission('leads', 'unlock'), ctrl.unlockOwnership);

router.get('/:id/activities', requirePermission('leads', 'view'), ctrl.getActivities);
router.get('/:id/transfers', requirePermission('transfers', 'view'), ctrl.getTransferHistory);

module.exports = router;

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/lead.controller');
const { protect } = require('../middleware/AuthMiddleware');

// All routes require auth
router.use(protect);

// Pipeline (must be before /:id routes)
router.get('/pipeline', ctrl.getPipeline);
router.get('/followups/due', ctrl.getDueFollowUps);
router.get('/followups', ctrl.getFollowUps);
router.get('/followups/summary', ctrl.getFollowUpDashboardSummary);
router.post('/followups/reminders/run', ctrl.triggerReminderSweep);

// CRUD
router.get('/', ctrl.getLeads);
router.post('/', ctrl.createLead);
router.get('/:id', ctrl.getLeadById);
router.put('/:id', ctrl.updateLead);
router.delete('/:id', ctrl.deleteLead);

// Actions
router.post('/:id/assign', ctrl.assignCounsellor);
router.post('/:id/status', ctrl.updateStatus);
router.post('/:id/followup', ctrl.scheduleFollowUp);
router.get('/:id/followups', ctrl.getLeadFollowUps);
router.post('/:id/followups/:followUpId/complete', ctrl.completeFollowUp);
router.post('/:id/note', ctrl.addNote);
router.post('/:id/convert', ctrl.convertToStudent);
router.post('/:id/score', ctrl.recalculateScore);

// Timeline
router.get('/:id/activities', ctrl.getActivities);

module.exports = router;

const leadsService = require('./leads.service');

const createLegacyProxy = (handlerName) => async (req, res, next) =>
  leadsService.executeLegacyLeadHandler(handlerName, req, res, next);

exports.getWorkflowOptions = createLegacyProxy('getWorkflowOptions');
exports.getPipeline = createLegacyProxy('getPipeline');
exports.getDueFollowUps = createLegacyProxy('getDueFollowUps');
exports.getFollowUps = createLegacyProxy('getFollowUps');
exports.getFollowUpDashboardSummary = createLegacyProxy('getFollowUpDashboardSummary');
exports.triggerReminderSweep = createLegacyProxy('triggerReminderSweep');
exports.getLeads = createLegacyProxy('getLeads');
exports.createLead = createLegacyProxy('createLead');
exports.getLeadById = createLegacyProxy('getLeadById');
exports.updateLead = createLegacyProxy('updateLead');
exports.deleteLead = createLegacyProxy('deleteLead');
exports.assignCounsellor = createLegacyProxy('assignCounsellor');
exports.getAssignments = createLegacyProxy('getAssignments');
exports.saveAssignments = createLegacyProxy('saveAssignments');
exports.removeAssignment = createLegacyProxy('removeAssignment');
exports.updateStatus = createLegacyProxy('updateStatus');
exports.scheduleFollowUp = createLegacyProxy('scheduleFollowUp');
exports.getLeadFollowUps = createLegacyProxy('getLeadFollowUps');
exports.completeFollowUp = createLegacyProxy('completeFollowUp');
exports.addNote = createLegacyProxy('addNote');
exports.convertToStudent = createLegacyProxy('convertToStudent');
exports.recalculateScore = createLegacyProxy('recalculateScore');
exports.lockOwnership = createLegacyProxy('lockOwnership');
exports.unlockOwnership = createLegacyProxy('unlockOwnership');
exports.getActivities = createLegacyProxy('getActivities');
exports.getTransferHistory = createLegacyProxy('getTransferHistory');

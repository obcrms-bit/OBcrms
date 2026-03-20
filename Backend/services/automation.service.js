const AutomationRule = require('../models/AutomationRule');
const AutomationLog = require('../models/AutomationLog');
const Lead = require('../models/Lead');
const User = require('../models/User');
const { createNotification } = require('./notification.service');
const { findBestCounsellorMatch } = require('./counsellorMatching.service');

const getByPath = (source, field) =>
  String(field || '')
    .split('.')
    .filter(Boolean)
    .reduce((value, key) => (value && typeof value === 'object' ? value[key] : undefined), source);

const compareValues = (actual, operator, expected) => {
  switch (operator) {
  case 'equals':
    return String(actual ?? '') === String(expected ?? '');
  case 'not_equals':
    return String(actual ?? '') !== String(expected ?? '');
  case 'includes':
    return Array.isArray(actual)
      ? actual.map(String).includes(String(expected))
      : String(actual ?? '').toLowerCase().includes(String(expected ?? '').toLowerCase());
  case 'gt':
    return Number(actual) > Number(expected);
  case 'gte':
    return Number(actual) >= Number(expected);
  case 'lt':
    return Number(actual) < Number(expected);
  case 'lte':
    return Number(actual) <= Number(expected);
  case 'exists':
    return expected
      ? typeof actual !== 'undefined' && actual !== null
      : typeof actual === 'undefined' || actual === null;
  default:
    return false;
  }
};

const evaluateConditions = (target, conditions = []) =>
  conditions.every((condition) =>
    compareValues(getByPath(target, condition.field), condition.operator, condition.value)
  );

const persistLead = async (target) => {
  if (target?.save && typeof target.save === 'function') {
    await target.save();
    return target;
  }

  if (target?._id) {
    return Lead.findById(target._id);
  }

  return target;
};

const executeAction = async ({ action, target, actor, companyId, branchId, context = {} }) => {
  switch (action.type) {
  case 'notify_assignee': {
    const assigneeId = target?.assignedCounsellor || target?.assignedTo || context?.assignedTo;
    if (!assigneeId) {
      return 'No assignee available for notification.';
    }

    await createNotification({
      companyId,
      branchId,
      userId: assigneeId,
      type: 'approval',
      title: action.config?.title || 'Automation notification',
      message:
        action.config?.message ||
        `Automation triggered for ${target?.fullName || target?.name || 'a record'}.`,
      entityType: context.entityType || 'lead',
      entityId: target?._id,
      metadata: {
        triggerEvent: context.triggerEvent,
      },
    });
    return 'Assignee notified.';
  }
  case 'notify_branch_manager': {
    const managers = await User.find({
      companyId,
      isActive: true,
      branchId: branchId || target?.branchId || null,
      $or: [
        { role: { $in: ['manager', 'branch_manager', 'admin', 'head_office_admin'] } },
        { managerEnabled: true },
      ],
    })
      .select('_id')
      .lean();

    await Promise.all(
      managers.map((manager) =>
        createNotification({
          companyId,
          branchId: branchId || target?.branchId || null,
          userId: manager._id,
          type: 'approval',
          title: action.config?.title || 'Automation escalation',
          message:
            action.config?.message ||
            `Automation escalated ${target?.fullName || target?.name || 'a record'} to branch leadership.`,
          entityType: context.entityType || 'lead',
          entityId: target?._id,
          metadata: {
            triggerEvent: context.triggerEvent,
          },
        })
      )
    );
    return `Branch managers notified (${managers.length}).`;
  }
  case 'tag_lead': {
    const tag = String(action.config?.tag || '').trim();
    if (!tag) {
      return 'No tag configured.';
    }
    target.tags = Array.isArray(target.tags) ? target.tags : [];
    if (!target.tags.includes(tag)) {
      target.tags.push(tag);
      await persistLead(target);
    }
    return `Tag ${tag} applied.`;
  }
  case 'set_priority': {
    const priority = String(action.config?.priority || '').trim().toLowerCase();
    if (!priority) {
      return 'No priority configured.';
    }
    target.priority = priority;
    await persistLead(target);
    return `Priority set to ${priority}.`;
  }
  case 'create_followup': {
    const offsetHours = Math.max(Number(action.config?.offsetHours || 24), 1);
    const scheduledAt = new Date(Date.now() + offsetHours * 60 * 60 * 1000);
    target.followUps = Array.isArray(target.followUps) ? target.followUps : [];
    target.followUps.push({
      scheduledAt,
      scheduledBy: actor?._id,
      type: action.config?.method || 'call',
      notes: action.config?.notes || `Automation follow-up scheduled by ${context.triggerEvent}.`,
      status: 'pending',
      counsellorName: actor?.name || '',
    });
    await persistLead(target);
    return `Follow-up created for ${scheduledAt.toISOString()}.`;
  }
  case 'assign_country_counsellor': {
    const match = await findBestCounsellorMatch({
      companyId,
      branchId: target?.branchId || branchId || actor?.branchId || null,
      preferredCountries: target?.preferredCountries || context?.preferredCountries || [],
    });

    if (!match?.counsellor?._id) {
      return 'No counsellor matched.';
    }

    target.assignedCounsellor = match.counsellor._id;
    target.assignedTo = match.counsellor._id;
    target.ownerUserId = target.ownerUserId || match.counsellor._id;
    target.assignmentHistory = Array.isArray(target.assignmentHistory) ? target.assignmentHistory : [];
    target.assignmentHistory.push({
      counsellor: match.counsellor._id,
      assignedAt: new Date(),
      assignedBy: actor?._id,
      reason: `Automation assignment by country match (${(match.matchedCountries || []).join(', ')})`,
    });
    await persistLead(target);
    return `Assigned to ${match.counsellor.name}.`;
  }
  default:
    return `Unknown action ${action.type}.`;
  }
};

const logRun = async ({ companyId, branchId, ruleId, module, targetId, status, message, metadata = {} }) =>
  AutomationLog.create({
    companyId,
    branchId,
    ruleId,
    module,
    targetId,
    status,
    message,
    metadata,
    runAt: new Date(),
  });

const runAutomationEvent = async ({
  companyId,
  branchId = null,
  triggerEvent,
  module,
  target,
  actor = null,
  context = {},
}) => {
  if (!companyId || !triggerEvent) {
    return [];
  }

  const rules = await AutomationRule.find({
    companyId,
    isActive: true,
    triggerEvent: String(triggerEvent).toLowerCase(),
    $or: [{ branchId: null }, { branchId }, { branchId: target?.branchId || null }],
  }).lean();

  const results = [];

  for (const rule of rules) {
    try {
      if (!evaluateConditions(target?.toObject ? target.toObject() : target, rule.conditions || [])) {
        await logRun({
          companyId,
          branchId: branchId || target?.branchId || null,
          ruleId: rule._id,
          module: module || rule.module,
          targetId: target?._id,
          status: 'skipped',
          message: 'Conditions not met.',
          metadata: { triggerEvent },
        });
        results.push({ ruleId: rule._id, status: 'skipped' });
        continue;
      }

      const actionMessages = [];
      for (const action of rule.actions || []) {
        actionMessages.push(
          await executeAction({
            action,
            target,
            actor,
            companyId,
            branchId: branchId || target?.branchId || null,
            context: {
              ...context,
              triggerEvent,
              entityType: module || rule.module,
            },
          })
        );
      }

      await AutomationRule.findByIdAndUpdate(rule._id, {
        $inc: { runCount: 1 },
        $set: { lastRunAt: new Date() },
      });

      await logRun({
        companyId,
        branchId: branchId || target?.branchId || null,
        ruleId: rule._id,
        module: module || rule.module,
        targetId: target?._id,
        status: 'success',
        message: actionMessages.join(' '),
        metadata: { triggerEvent },
      });

      results.push({ ruleId: rule._id, status: 'success', message: actionMessages.join(' ') });
    } catch (error) {
      await AutomationRule.findByIdAndUpdate(rule._id, {
        $inc: { failureCount: 1 },
        $set: { lastRunAt: new Date() },
      });
      await logRun({
        companyId,
        branchId: branchId || target?.branchId || null,
        ruleId: rule._id,
        module: module || rule.module,
        targetId: target?._id,
        status: 'failure',
        message: error.message,
        metadata: { triggerEvent },
      });
      results.push({ ruleId: rule._id, status: 'failure', message: error.message });
    }
  }

  return results;
};

module.exports = {
  runAutomationEvent,
};

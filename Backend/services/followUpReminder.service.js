const Lead = require('../models/Lead');
const Notification = require('../models/Notification');
const User = require('../models/User');
const EmailService = require('../utils/EmailService');

const intervalHandles = new Set();
let isSweepRunning = false;
const sentSummaryKeys = new Map();

const normalizeBoolean = (value, fallback = false) => {
  if (typeof value === 'undefined') {
    return fallback;
  }
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
};

const formatLeadName = (lead) => lead?.fullName || lead?.name || `${lead?.firstName || ''} ${lead?.lastName || ''}`.trim();

const getReminderFrequencyMs = () =>
  Math.max(Number(process.env.FOLLOWUP_REMINDER_FREQUENCY_MINUTES || 180), 15) * 60 * 1000;

const getSchedulerIntervalMs = () =>
  Math.max(Number(process.env.FOLLOWUP_REMINDER_INTERVAL_MINUTES || 15), 5) * 60 * 1000;

const getLeadUrl = (leadId) => {
  const frontendUrl = process.env.FRONTEND_URL || process.env.APP_URL;
  if (!frontendUrl) {
    return '';
  }

  return `${String(frontendUrl).replace(/\/$/, '')}/leads/${leadId}`;
};

const pushActivity = (lead, type, description, metadata = {}) => {
  lead.activities = lead.activities || [];
  lead.activities.push({
    type,
    description,
    metadata,
  });
};

const createNotification = async ({ companyId, userId, title, message, leadId, metadata }) => {
  try {
    await Notification.create({
      companyId,
      user: userId,
      type: 'reminder',
      title,
      message,
      entityType: 'lead',
      entityId: leadId,
      link: getLeadUrl(leadId),
      metadata,
    });
  } catch (error) {
    console.error('Failed to create reminder notification:', error.message);
  }
};

const markFollowUpOverdue = (lead, followUp, now) => {
  if (followUp.status !== 'pending' && followUp.status !== 'overdue') {
    return false;
  }

  if (new Date(followUp.scheduledAt) > now) {
    return false;
  }

  let changed = false;

  if (followUp.status !== 'overdue') {
    followUp.status = 'overdue';
    changed = true;
    pushActivity(
      lead,
      'followup_marked_overdue',
      `Follow-up marked overdue for ${new Date(followUp.scheduledAt).toLocaleString()}`,
      {
        followUpId: followUp._id,
        scheduledAt: followUp.scheduledAt,
      }
    );
  }

  followUp.reminderMeta = followUp.reminderMeta || {};
  if (!followUp.reminderMeta.isOverdue) {
    followUp.reminderMeta.isOverdue = true;
    changed = true;
  }

  return changed;
};

const shouldSendReminder = (followUp, now) => {
  const reminderMeta = followUp.reminderMeta || {};
  const lastReminderSentAt = reminderMeta.lastReminderSentAt
    ? new Date(reminderMeta.lastReminderSentAt)
    : null;

  if (!lastReminderSentAt) {
    return true;
  }

  if (reminderMeta.nextReminderAt && new Date(reminderMeta.nextReminderAt) > now) {
    return false;
  }

  return now.getTime() - lastReminderSentAt.getTime() >= getReminderFrequencyMs();
};

const updateNextFollowUp = (lead) => {
  const nextFollowUp = (lead.followUps || [])
    .filter((item) => ['pending', 'overdue'].includes(item.status))
    .sort((left, right) => new Date(left.scheduledAt) - new Date(right.scheduledAt))[0];

  lead.nextFollowUp = nextFollowUp ? nextFollowUp.scheduledAt : null;
};

const serializeFollowUpItem = (lead, followUp) => ({
  leadId: lead._id,
  leadName: formatLeadName(lead),
  leadPhone: lead.mobile || lead.phone || '',
  leadEmail: lead.email || '',
  counsellorName: lead.assignedCounsellor?.name || '',
  counsellorEmail: lead.assignedCounsellor?.email || '',
  scheduledAt: followUp.scheduledAt,
  status: followUp.status,
  method: followUp.completionMethod || followUp.type || 'call',
});

async function runReminderSweep() {
  if (isSweepRunning) {
    return { skipped: true, message: 'Reminder sweep already running.' };
  }

  isSweepRunning = true;
  const now = new Date();
  const stats = {
    leadsScanned: 0,
    followUpsMarkedOverdue: 0,
    remindersSent: 0,
    reminderFailures: 0,
    notificationsCreated: 0,
  };

  try {
    const leads = await Lead.find({
      deletedAt: null,
      followUps: {
        $elemMatch: {
          status: { $in: ['pending', 'overdue'] },
          scheduledAt: { $lte: now },
        },
      },
    }).populate('assignedCounsellor', 'name email emailNotifications role');

    stats.leadsScanned = leads.length;

    for (const lead of leads) {
      let leadChanged = false;

      for (const followUp of lead.followUps || []) {
        if (!['pending', 'overdue'].includes(followUp.status)) {
          continue;
        }

        if (new Date(followUp.scheduledAt) > now) {
          continue;
        }

        if (markFollowUpOverdue(lead, followUp, now)) {
          stats.followUpsMarkedOverdue += 1;
          leadChanged = true;
        }

        if (!EmailService.isConfigured() || !lead.assignedCounsellor?.email) {
          followUp.reminderMeta = followUp.reminderMeta || {};
          followUp.reminderMeta.reminderStatus = 'skipped';
          followUp.reminderMeta.nextReminderAt = new Date(now.getTime() + getReminderFrequencyMs());
          leadChanged = true;
          continue;
        }

        if (!shouldSendReminder(followUp, now)) {
          continue;
        }

        try {
          await EmailService.sendFollowUpReminder({
            to: lead.assignedCounsellor.email,
            counsellorName: lead.assignedCounsellor.name,
            leadName: formatLeadName(lead),
            leadPhone: lead.mobile || lead.phone,
            leadEmail: lead.email,
            scheduledAt: followUp.scheduledAt,
            method: followUp.completionMethod || followUp.type,
            leadUrl: getLeadUrl(lead._id),
            reminderCount: (followUp.reminderMeta?.reminderCount || 0) + 1,
          });

          followUp.reminderMeta = followUp.reminderMeta || {};
          followUp.reminderMeta.lastReminderSentAt = now;
          followUp.reminderMeta.reminderCount = (followUp.reminderMeta.reminderCount || 0) + 1;
          followUp.reminderMeta.reminderStatus = 'sent';
          followUp.reminderMeta.nextReminderAt = new Date(now.getTime() + getReminderFrequencyMs());
          followUp.reminderMeta.lastError = '';
          followUp.reminderMeta.history = followUp.reminderMeta.history || [];
          followUp.reminderMeta.history.push({
            sentAt: now,
            status: 'sent',
            message: 'Overdue reminder email sent successfully.',
          });

          pushActivity(lead, 'reminder_sent', 'Overdue follow-up reminder sent to counsellor', {
            followUpId: followUp._id,
            sentTo: lead.assignedCounsellor.email,
            reminderCount: followUp.reminderMeta.reminderCount,
          });

          await createNotification({
            companyId: lead.companyId,
            userId: lead.assignedCounsellor._id,
            title: 'Overdue follow-up reminder',
            message: `${formatLeadName(lead)} has an overdue follow-up scheduled for ${new Date(
              followUp.scheduledAt
            ).toLocaleString()}.`,
            leadId: lead._id,
            metadata: {
              followUpId: followUp._id,
              scheduledAt: followUp.scheduledAt,
            },
          });

          stats.notificationsCreated += 1;
          stats.remindersSent += 1;
          leadChanged = true;
        } catch (error) {
          followUp.reminderMeta = followUp.reminderMeta || {};
          followUp.reminderMeta.reminderStatus = 'failed';
          followUp.reminderMeta.lastError = error.message;
          followUp.reminderMeta.nextReminderAt = new Date(now.getTime() + getReminderFrequencyMs());
          followUp.reminderMeta.history = followUp.reminderMeta.history || [];
          followUp.reminderMeta.history.push({
            sentAt: now,
            status: 'failed',
            message: 'Failed to send overdue reminder email.',
            error: error.message,
          });

          pushActivity(lead, 'reminder_failed', 'Failed to send overdue follow-up reminder', {
            followUpId: followUp._id,
            error: error.message,
          });

          console.error('Follow-up reminder send failed:', error.message);
          stats.reminderFailures += 1;
          leadChanged = true;
        }
      }

      if (leadChanged) {
        updateNextFollowUp(lead);
        await lead.save();
      }
    }

    return stats;
  } finally {
    isSweepRunning = false;
  }
}

async function sendDailySummaries() {
  if (!normalizeBoolean(process.env.FOLLOWUP_DAILY_SUMMARY_ENABLED, false)) {
    return { sent: 0, skipped: true };
  }

  if (!EmailService.isConfigured()) {
    return { sent: 0, skipped: true, reason: 'Email not configured' };
  }

  const targetHour = Number(process.env.FOLLOWUP_DAILY_SUMMARY_HOUR || 7);
  const now = new Date();
  if (now.getHours() !== targetHour) {
    return { sent: 0, skipped: true, reason: 'Not within daily summary hour' };
  }

  const todayKey = now.toISOString().slice(0, 10);
  const users = await User.find({
    isActive: true,
    email: { $exists: true, $ne: '' },
    $or: [
      { role: { $in: ['super_admin', 'admin', 'manager'] } },
      { role: 'counselor', 'emailNotifications.dailyReport': true },
    ],
  }).select('name email role companyId emailNotifications');

  let sent = 0;

  for (const user of users) {
    const cacheKey = `${user._id}:${todayKey}`;
    if (sentSummaryKeys.get(cacheKey)) {
      continue;
    }

    const leadQuery = { companyId: user.companyId, deletedAt: null };
    if (user.role === 'counselor') {
      leadQuery.assignedCounsellor = user._id;
    }

    const leads = await Lead.find({
      ...leadQuery,
      followUps: {
        $elemMatch: {
          status: { $in: ['pending', 'overdue'] },
        },
      },
    }).populate('assignedCounsellor', 'name email');

    const items = [];

    for (const lead of leads) {
      for (const followUp of lead.followUps || []) {
        const scheduledAt = new Date(followUp.scheduledAt);
        const isToday = scheduledAt.toDateString() === now.toDateString();
        const isOverdue = followUp.status === 'overdue' || scheduledAt < now;

        if (!['pending', 'overdue'].includes(followUp.status) || (!isToday && !isOverdue)) {
          continue;
        }

        items.push(serializeFollowUpItem(lead, followUp));
      }
    }

    if (!items.length) {
      sentSummaryKeys.set(cacheKey, true);
      continue;
    }

    const title =
      user.role === 'counselor'
        ? 'Your daily follow-up summary'
        : 'Daily follow-up summary for your team';

    try {
      await EmailService.sendFollowUpSummary({
        to: user.email,
        recipientName: user.name,
        title,
        intro:
          user.role === 'counselor'
            ? 'These are your overdue and due-today follow-ups.'
            : 'These are the overdue and due-today follow-ups across your team.',
        items: items.slice(0, 50),
      });
      sentSummaryKeys.set(cacheKey, true);
      sent += 1;
    } catch (error) {
      console.error('Failed to send daily follow-up summary:', error.message);
    }
  }

  return { sent };
}

function startReminderScheduler() {
  if (!normalizeBoolean(process.env.FOLLOWUP_REMINDER_ENABLED, true)) {
    console.log('Follow-up reminder scheduler is disabled.');
    return () => {};
  }

  const runSweep = async () => {
    try {
      const stats = await runReminderSweep();
      if (stats?.leadsScanned) {
        console.log('Follow-up reminder sweep completed:', stats);
      }
      await sendDailySummaries();
    } catch (error) {
      console.error('Follow-up reminder scheduler error:', error.message);
    }
  };

  runSweep();
  const handle = setInterval(runSweep, getSchedulerIntervalMs());
  intervalHandles.add(handle);
  console.log(
    `Follow-up reminder scheduler started. Interval: ${getSchedulerIntervalMs() / 60000} minutes.`
  );

  return () => {
    clearInterval(handle);
    intervalHandles.delete(handle);
  };
}

function stopReminderSchedulers() {
  for (const handle of intervalHandles) {
    clearInterval(handle);
  }
  intervalHandles.clear();
}

module.exports = {
  runReminderSweep,
  sendDailySummaries,
  startReminderScheduler,
  stopReminderSchedulers,
};

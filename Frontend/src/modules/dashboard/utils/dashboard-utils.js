const DAY_IN_MS = 24 * 60 * 60 * 1000;

export const FOLLOW_UP_TABS = [
  { key: 'due_today', label: 'Scheduled Follow-up' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'completed', label: 'Completed Today' },
];

export const CALENDAR_VIEWS = [
  { key: 'month', label: 'Month' },
  { key: 'week', label: 'Week' },
  { key: 'day', label: 'Day' },
  { key: 'list', label: 'List' },
];

export const normalizeDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const addDays = (value, days) => {
  const next = new Date(value);
  next.setDate(next.getDate() + days);
  return next;
};

export const startOfDay = (value) => {
  const next = new Date(value);
  next.setHours(0, 0, 0, 0);
  return next;
};

export const endOfDay = (value) => {
  const next = new Date(value);
  next.setHours(23, 59, 59, 999);
  return next;
};

export const startOfWeek = (value) => addDays(startOfDay(value), -startOfDay(value).getDay());

export const startOfMonthGrid = (value) => {
  const firstDay = new Date(value.getFullYear(), value.getMonth(), 1);
  return addDays(firstDay, -firstDay.getDay());
};

export const isSameDay = (left, right) =>
  Boolean(
    left &&
      right &&
      left.getFullYear() === right.getFullYear() &&
      left.getMonth() === right.getMonth() &&
      left.getDate() === right.getDate()
  );

export const formatClockTime = (value, timeZone) =>
  new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone,
  }).format(value);

export const formatClockDate = (value, timeZone) =>
  new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    timeZone,
  }).format(value);

export const formatCalendarHeading = (value) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(value);

export const formatWeekday = (value, format = 'short') =>
  new Intl.DateTimeFormat('en-US', { weekday: format }).format(value);

export const getGreeting = (value) => {
  const hour = value.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

export const getDisplayName = (record = {}) =>
  record.fullName ||
  record.name ||
  [record.firstName, record.lastName].filter(Boolean).join(' ').trim() ||
  'Unnamed record';

export const getFollowUpNote = (item) =>
  item?.followUp?.notes ||
  item?.followUp?.remarks ||
  item?.followUp?.remark ||
  item?.followUp?.message ||
  'No note has been added yet.';

export const deriveUpcomingBirthdays = (leadRecords = [], studentRecords = []) => {
  const today = startOfDay(new Date());
  const candidates = [
    ...leadRecords.map((lead) => ({
      id: `lead-${lead._id}`,
      name: getDisplayName(lead),
      role: 'Lead',
      branchName: lead.branchName || '',
      birthday: normalizeDate(lead.dob),
    })),
    ...studentRecords.map((student) => ({
      id: `student-${student._id}`,
      name: getDisplayName(student),
      role: 'Student',
      branchName: student.branchName || '',
      birthday: normalizeDate(student.dateOfBirth),
    })),
  ]
    .filter((candidate) => candidate.birthday)
    .map((candidate) => {
      const nextBirthday = new Date(
        today.getFullYear(),
        candidate.birthday.getMonth(),
        candidate.birthday.getDate()
      );

      if (nextBirthday < today) {
        nextBirthday.setFullYear(nextBirthday.getFullYear() + 1);
      }

      return {
        ...candidate,
        upcomingOn: nextBirthday,
        daysUntil: Math.round((startOfDay(nextBirthday).getTime() - today.getTime()) / DAY_IN_MS),
      };
    });

  return candidates
    .sort((left, right) => left.upcomingOn.getTime() - right.upcomingOn.getTime())
    .slice(0, 6);
};

export const buildCalendarEvents = (summary) =>
  [...(summary?.pendingFollowUps || []), ...(summary?.completedToday || [])]
    .map((item) => {
      const scheduledAt = normalizeDate(item.scheduledAt);
      if (!scheduledAt) return null;

      return {
        id: item._id,
        leadId: item.leadId,
        leadName: item.leadName,
        counsellorName: item.assignedCounsellor?.name || 'Unassigned',
        note: getFollowUpNote(item),
        scheduledAt,
        urgency: item.urgency,
        status: item.status,
      };
    })
    .filter(Boolean)
    .sort((left, right) => left.scheduledAt.getTime() - right.scheduledAt.getTime());

export const moveCalendarCursor = (cursor, view, direction) => {
  if (view === 'month') {
    return new Date(cursor.getFullYear(), cursor.getMonth() + direction, 1);
  }
  if (view === 'week') {
    return addDays(cursor, direction * 7);
  }
  return addDays(cursor, direction);
};

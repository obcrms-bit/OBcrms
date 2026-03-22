export const getLeadDisplayName = (lead) =>
  [
    lead?.name,
    lead?.fullName,
    [lead?.firstName, lead?.lastName].filter(Boolean).join(' ').trim(),
  ].find((value) => String(value || '').trim()) || 'Unnamed lead';

export const getLeadPrimaryContact = (lead) =>
  lead?.mobile || lead?.phone || lead?.email || 'No contact info';

const normalizeAssigneeId = (assignee) =>
  String(assignee?._id || assignee?.id || assignee || '')
    .trim();

export const getLeadAssignees = (lead) => {
  const items = [];
  const seen = new Set();

  [lead?.primaryAssignee, ...(Array.isArray(lead?.assignees) ? lead.assignees : []), lead?.assignedCounsellor]
    .filter(Boolean)
    .forEach((assignee) => {
      const id = normalizeAssigneeId(assignee);
      if (!id || seen.has(id)) {
        return;
      }
      seen.add(id);
      items.push(assignee);
    });

  return items;
};

export const getLeadPrimaryAssignee = (lead) =>
  lead?.primaryAssignee || lead?.primaryAssigneeId || lead?.assignedCounsellor || null;

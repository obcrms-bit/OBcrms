'use client';

type AssignmentAvatarProps = {
  assignees?: any[];
  primaryAssignee?: any;
  max?: number;
  compact?: boolean;
};

const normalizeId = (value: any) => String(value?._id || value?.id || value || '');

const getInitials = (value = '') =>
  String(value || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'NA';

export default function LeadAssignmentAvatars({
  assignees = [],
  primaryAssignee = null,
  max = 4,
  compact = false,
}: AssignmentAvatarProps) {
  const items: any[] = [];
  const seen = new Set<string>();

  [primaryAssignee, ...assignees].filter(Boolean).forEach((assignee) => {
    const id = normalizeId(assignee);
    if (!id || seen.has(id)) {
      return;
    }
    seen.add(id);
    items.push(assignee);
  });

  const visibleAssignees = items.slice(0, max);

  if (!visibleAssignees.length) {
    return <span className="text-sm text-slate-500">Unassigned</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {visibleAssignees.map((assignee) => {
          const isPrimary = normalizeId(assignee) === normalizeId(primaryAssignee);
          return (
            <div
              key={normalizeId(assignee)}
              className={`flex items-center justify-center rounded-full border-2 border-white text-[11px] font-semibold shadow-sm ${
                compact ? 'h-7 w-7' : 'h-8 w-8'
              } ${isPrimary ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-700'}`}
              title={`${assignee?.name || 'Unknown'}${isPrimary ? ' (Primary)' : ''}`}
            >
              {getInitials(assignee?.name)}
            </div>
          );
        })}
      </div>
      <span className="text-xs text-slate-500">
        {items.length} assignee{items.length > 1 ? 's' : ''}
      </span>
    </div>
  );
}

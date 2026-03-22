'use client';

type SlaIndicatorProps = {
  nextFollowUp?: string | Date | null;
  slaHours?: number | null;
};

export default function SlaIndicator({
  nextFollowUp,
  slaHours = null,
}: SlaIndicatorProps) {
  if (!nextFollowUp && !slaHours) {
    return (
      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
        No SLA
      </span>
    );
  }

  const nextDate = nextFollowUp ? new Date(nextFollowUp) : null;
  const now = Date.now();
  const isOverdue = nextDate ? nextDate.getTime() < now : false;
  const isDueSoon = nextDate ? nextDate.getTime() - now < 24 * 60 * 60 * 1000 : false;

  const toneClassName = isOverdue
    ? 'bg-rose-100 text-rose-700'
    : isDueSoon
      ? 'bg-amber-100 text-amber-700'
      : 'bg-emerald-100 text-emerald-700';

  const label = isOverdue
    ? 'Overdue'
    : isDueSoon
      ? 'Due soon'
      : slaHours
        ? `${slaHours}h SLA`
        : 'On track';

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${toneClassName}`}>
      {label}
    </span>
  );
}

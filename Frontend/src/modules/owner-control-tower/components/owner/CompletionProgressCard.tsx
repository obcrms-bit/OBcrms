import { SectionCard } from '@/components/app/design-system';
import type { SetupSection } from '../../types/owner-control.types';
import { summarizeSetup } from '../../utils/owner-control.utils';
import OwnerStatusBadge from './OwnerStatusBadge';

export default function CompletionProgressCard({
  name,
  completion,
  sections,
}: {
  name: string;
  completion: number;
  sections: SetupSection[];
}) {
  const summary = summarizeSetup(sections);

  return (
    <SectionCard className="h-full">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-teal-700">
            Setup Completion
          </p>
          <h3 className="mt-2 text-lg font-semibold text-slate-950">{name}</h3>
          <p className="mt-2 text-sm text-slate-500">
            {summary.complete}/{summary.total} setup blocks are production-ready.
          </p>
        </div>
        <OwnerStatusBadge
          label={`${completion}%`}
          tone={completion >= 90 ? 'success' : completion >= 70 ? 'warning' : 'danger'}
        />
      </div>
      <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,#0f766e_0%,#14b8a6_100%)] transition-all"
          style={{ width: `${Math.max(0, Math.min(completion, 100))}%` }}
        />
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Complete
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{summary.complete}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            In Progress
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{summary.inProgress}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Blocked
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{summary.blocked}</p>
        </div>
      </div>
    </SectionCard>
  );
}

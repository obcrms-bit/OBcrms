import { ArrowRight, ShieldAlert } from 'lucide-react';
import type { RiskAlert } from '../../types/owner-control.types';
import { getSeverityTone } from '../../utils/owner-control.utils';
import OwnerStatusBadge from './OwnerStatusBadge';

export default function AlertsRiskCard({ alert }: { alert: RiskAlert }) {
  const tone = getSeverityTone(alert.severity);

  return (
    <article className="rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-[var(--ds-shadow-soft)]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-950">{alert.title}</p>
            <p className="mt-1 text-sm text-slate-500">{alert.consultancyName}</p>
          </div>
        </div>
        <OwnerStatusBadge
          label={alert.severity}
          tone={tone === 'pending' ? 'warning' : tone === 'completed' ? 'success' : 'danger'}
        />
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-600">{alert.description}</p>
      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        <p className="font-semibold text-slate-900">Next recommendation</p>
        <p className="mt-1">{alert.nextAction}</p>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 text-xs uppercase tracking-[0.16em] text-slate-500">
        <span>{alert.category.replace(/_/g, ' ')}</span>
        <span>{new Date(alert.createdAt).toLocaleDateString()}</span>
        <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
          Review <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </article>
  );
}

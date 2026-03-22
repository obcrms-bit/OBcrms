import { AlertCircle, CheckCircle2, CircleDashed, TimerReset } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SetupSection } from '../../types/owner-control.types';
import { getSetupTone } from '../../utils/owner-control.utils';
import OwnerStatusBadge from './OwnerStatusBadge';

const icons = {
  complete: CheckCircle2,
  in_progress: TimerReset,
  pending: CircleDashed,
  blocked: AlertCircle,
  failed: AlertCircle,
};

export default function ConsultancySetupChecklist({ sections }: { sections: SetupSection[] }) {
  return (
    <div className="space-y-3">
      {sections.map((section) => {
        const Icon = icons[section.status];
        const tone = getSetupTone(section.status);

        return (
          <div
            key={section.key}
            className="rounded-[1.35rem] border border-slate-200 bg-white/90 p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    'mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl',
                    tone === 'completed'
                      ? 'bg-emerald-50 text-emerald-600'
                      : tone === 'due_today'
                        ? 'bg-sky-50 text-sky-600'
                        : tone === 'pending'
                          ? 'bg-amber-50 text-amber-600'
                          : 'bg-rose-50 text-rose-600'
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-950">{section.label}</h4>
                  <p className="mt-1 text-sm text-slate-500">{section.nextAction}</p>
                  {section.blockedReason ? (
                    <p className="mt-2 text-sm text-rose-600">{section.blockedReason}</p>
                  ) : null}
                </div>
              </div>
              <OwnerStatusBadge
                label={section.status.replace(/_/g, ' ')}
                tone={
                  tone === 'completed'
                    ? 'success'
                    : tone === 'due_today'
                      ? 'info'
                      : tone === 'pending'
                        ? 'warning'
                        : 'danger'
                }
              />
            </div>
            <div className="mt-4 flex items-center justify-between gap-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              <span>{section.owner}</span>
              <span>{section.completion}% complete</span>
              <span>{new Date(section.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

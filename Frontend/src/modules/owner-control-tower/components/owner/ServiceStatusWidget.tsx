import { SectionCard, SectionHeader } from '@/components/app/design-system';
import type { ServiceChecklistItem } from '../../types/owner-control.types';
import { getSetupTone } from '../../utils/owner-control.utils';
import OwnerStatusBadge from './OwnerStatusBadge';

export default function ServiceStatusWidget({ items }: { items: ServiceChecklistItem[] }) {
  return (
    <SectionCard>
      <SectionHeader
        eyebrow="Service Readiness"
        title="Go-live checklist and service ownership"
        description="Owner visibility into the operational blocks that still need attention before a consultancy is fully ready."
      />
      <div className="mt-6 space-y-3">
        {items.map((item) => {
          const tone = getSetupTone(item.status);
          return (
            <div
              key={item.id}
              className="flex flex-col gap-3 rounded-[1.35rem] border border-slate-200 bg-slate-50/80 p-4 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <p className="font-semibold text-slate-950">{item.name}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {item.owner}
                  {item.dependency ? ` • Dependency: ${item.dependency}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-500">{item.eta}</span>
                <OwnerStatusBadge
                  label={item.status.replace(/_/g, ' ')}
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
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

import { SectionCard, SectionHeader } from '@/components/app/design-system';
import type { AuditLogRecord } from '../../types/owner-control.types';
import OwnerStatusBadge from './OwnerStatusBadge';

export default function AuditTimeline({ items }: { items: AuditLogRecord[] }) {
  return (
    <SectionCard>
      <SectionHeader
        eyebrow="Audit Trail"
        title="Owner-visible activity log"
        description="Every import, setup mutation, and template action remains reviewable from this master control layer."
      />
      <div className="mt-6 space-y-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-[1.35rem] border border-slate-200 bg-slate-50/80 p-4"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-semibold text-slate-950">{item.action}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {item.actor} • {item.target}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-500">
                  {new Date(item.timestamp).toLocaleString()}
                </span>
                <OwnerStatusBadge
                  label={item.outcome}
                  tone={
                    item.outcome === 'success'
                      ? 'success'
                      : item.outcome === 'warning'
                        ? 'warning'
                        : 'danger'
                  }
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

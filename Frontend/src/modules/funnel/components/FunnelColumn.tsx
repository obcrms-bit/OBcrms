'use client';

import { formatCurrency } from '@/components/app/shared';
import FunnelLeadCard from './FunnelLeadCard';

type FunnelColumnProps = {
  stage: any;
  stageData: any;
  isDragTarget?: boolean;
  onDragOver: (stageKey: string) => void;
  onDragLeave: () => void;
  onDropStage: (stageKey: string) => void;
  onOpenLead: (lead: any) => void;
  onDragStart: (lead: any) => void;
  disabledLeadId?: string;
};

export default function FunnelColumn({
  stage,
  stageData,
  isDragTarget = false,
  onDragOver,
  onDragLeave,
  onDropStage,
  onOpenLead,
  onDragStart,
  disabledLeadId = '',
}: FunnelColumnProps) {
  return (
    <section
      onDragOver={(event) => {
        event.preventDefault();
        onDragOver(stage.key);
      }}
      onDragLeave={onDragLeave}
      onDrop={(event) => {
        event.preventDefault();
        onDropStage(stage.key);
      }}
      className={`w-[320px] flex-shrink-0 rounded-[2rem] border p-4 transition ${
        isDragTarget
          ? 'border-blue-300 bg-blue-50/80 shadow-sm'
          : 'border-slate-200 bg-white shadow-sm'
      }`}
    >
      <div className="border-b border-slate-200 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: stage.color || '#1d4ed8' }}
              />
              {stage.name}
            </div>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              {stageData?.count || 0}
            </p>
          </div>
          <div className="text-right text-xs text-slate-500">
            <p>{stageData?.overdueFollowUpCount || 0} overdue</p>
            <p className="mt-1">
              {formatCurrency(stageData?.totalEstimatedValue || 0, 'USD')}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {(stageData?.leads || []).map((lead: any) => (
          <FunnelLeadCard
            key={lead._id}
            lead={lead}
            onOpen={onOpenLead}
            onDragStart={onDragStart}
            disabled={disabledLeadId === String(lead._id)}
          />
        ))}

        {!stageData?.leads?.length ? (
          <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-400">
            No leads in this Funnel stage
          </div>
        ) : null}
      </div>
    </section>
  );
}

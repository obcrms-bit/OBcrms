'use client';

import { Building2, CalendarClock, Flag } from 'lucide-react';
import { formatDate } from '@/components/app/shared';
import LeadAssignmentAvatars from './LeadAssignmentAvatars';
import SlaIndicator from './SlaIndicator';
import TransferBadge from './TransferBadge';

type FunnelLeadCardProps = {
  lead: any;
  onOpen: (lead: any) => void;
  onDragStart: (lead: any) => void;
  disabled?: boolean;
};

export default function FunnelLeadCard({
  lead,
  onOpen,
  onDragStart,
  disabled = false,
}: FunnelLeadCardProps) {
  return (
    <article
      draggable={!disabled}
      onDragStart={() => onDragStart(lead)}
      className={`rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm transition ${
        disabled ? 'opacity-50' : 'cursor-grab hover:-translate-y-0.5 hover:shadow-md'
      }`}
    >
      <button className="w-full text-left" onClick={() => onOpen(lead)} type="button">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {lead?.name || `${lead?.firstName || ''} ${lead?.lastName || ''}`.trim() || 'Unnamed lead'}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {lead?.source || 'Unknown source'}
              {lead?.campaign ? ` • ${lead.campaign}` : ''}
            </p>
          </div>
          <SlaIndicator
            nextFollowUp={lead?.nextFollowUp}
            slaHours={lead?.currentFunnelStageId?.slaHours || lead?.stage?.slaHours || null}
          />
        </div>

        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Building2 className="h-4 w-4 text-slate-400" />
            <span>{lead?.activeBranch?.name || lead?.activeBranchId?.name || lead?.branchName || 'No branch'}</span>
          </div>

          <LeadAssignmentAvatars
            assignees={lead?.assignees || []}
            primaryAssignee={lead?.primaryAssignee || lead?.primaryAssigneeId}
            compact
          />

          <div className="flex items-center gap-2 text-sm text-slate-600">
            <CalendarClock className="h-4 w-4 text-slate-400" />
            <span>
              {lead?.nextFollowUp ? `Follow-up ${formatDate(lead.nextFollowUp)}` : 'No follow-up scheduled'}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
              <Flag className="h-3.5 w-3.5" />
              {String(lead?.urgency || lead?.priority || 'medium').replace(/_/g, ' ')}
            </div>
            <TransferBadge status={lead?.transferStatus} />
          </div>
        </div>
      </button>
    </article>
  );
}

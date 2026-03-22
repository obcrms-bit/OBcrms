'use client';

import { ArrowRightLeft } from 'lucide-react';
import { DataTableSurface, SectionHeader } from '@/components/app/design-system';
import { EmptyState, StatusPill, formatDate, formatDateTime } from '@/components/app/shared';
import LeadAssignmentAvatars from './LeadAssignmentAvatars';
import SlaIndicator from './SlaIndicator';
import TransferBadge from './TransferBadge';

type FunnelListTableProps = {
  leads: any[];
  pagination: any;
  selectedIds: string[];
  onToggleSelect: (leadId: string) => void;
  onToggleAll: () => void;
  onOpenLead: (lead: any) => void;
};

export default function FunnelListTable({
  leads,
  pagination,
  selectedIds,
  onToggleSelect,
  onToggleAll,
  onOpenLead,
}: FunnelListTableProps) {
  return (
    <DataTableSurface>
      <SectionHeader
        eyebrow="Funnel List"
        title={`${pagination?.total || 0} records`}
        description={`Page ${pagination?.page || 1} of ${pagination?.pages || 1}`}
      />

      {!leads.length ? (
        <div className="mt-6">
          <EmptyState
            title="No Funnel records found"
            description="Try adjusting the stage, assignee, or overdue filters to widen the Funnel list."
            icon={ArrowRightLeft}
          />
        </div>
      ) : (
        <div className="ds-table-wrap mt-6">
          <table className="ds-table min-w-[1400px]">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={selectedIds.length > 0 && selectedIds.length === leads.length}
                    onChange={onToggleAll}
                  />
                </th>
                <th>Lead</th>
                <th>Current Stage</th>
                <th>Active Branch</th>
                <th>Primary Assignee</th>
                <th>All Assignees</th>
                <th>Status</th>
                <th>Source</th>
                <th>Next Follow-up</th>
                <th>Last Activity</th>
                <th>Transfer</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead._id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(String(lead._id))}
                      onChange={() => onToggleSelect(String(lead._id))}
                    />
                  </td>
                  <td>
                    <button className="text-left" onClick={() => onOpenLead(lead)} type="button">
                      <div className="font-semibold text-slate-900">{lead.name || lead.fullName}</div>
                      <div className="text-sm text-slate-500">{lead.email || lead.phone || 'No contact'}</div>
                    </button>
                  </td>
                  <td>
                    <StatusPill tone={lead.currentFunnelStageId?.key || lead.pipelineStage || lead.status}>
                      {lead.currentFunnelStageId?.name ||
                        String(lead.pipelineStage || lead.status || '').replace(/_/g, ' ')}
                    </StatusPill>
                  </td>
                  <td>{lead.activeBranchId?.name || lead.branchName || 'Not set'}</td>
                  <td>{lead.primaryAssigneeId?.name || 'Unassigned'}</td>
                  <td>
                    <LeadAssignmentAvatars
                      assignees={lead.assigneeIds || []}
                      primaryAssignee={lead.primaryAssigneeId}
                      compact
                    />
                  </td>
                  <td>
                    <SlaIndicator
                      nextFollowUp={lead.nextFollowUp}
                      slaHours={lead.currentFunnelStageId?.slaHours}
                    />
                  </td>
                  <td>{lead.source || 'Unknown'}</td>
                  <td>{lead.nextFollowUp ? formatDate(lead.nextFollowUp) : 'Not scheduled'}</td>
                  <td>{lead.updatedAt ? formatDateTime(lead.updatedAt) : 'No activity'}</td>
                  <td>
                    <TransferBadge
                      status={
                        Array.isArray(lead.transferHistory) && lead.transferHistory.length
                          ? lead.transferHistory[lead.transferHistory.length - 1]?.status || ''
                          : ''
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DataTableSurface>
  );
}

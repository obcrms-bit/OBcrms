import { Trash2, UserPlus } from 'lucide-react';
import {
  DataTableSurface,
  SectionHeader,
} from '@/components/app/design-system';
import {
  CATEGORY_STYLES,
  EmptyState,
  StatusPill,
  formatDate,
} from '@/components/app/shared';
import { getEntityLabel } from '@/src/services/access';
import {
  getLeadAssignees,
  getLeadDisplayName,
  getLeadPrimaryAssignee,
  getLeadPrimaryContact,
} from '../utils/lead-presenters';

const getAssigneeInitials = (assignee) =>
  String(assignee?.name || '?')
    .split(' ')
    .map((segment) => segment[0] || '')
    .join('')
    .slice(0, 2)
    .toUpperCase();

export default function LeadsTable({
  leads,
  pagination,
  router,
  onDelete,
  onPageChange,
}) {
  return (
    <DataTableSurface>
      <SectionHeader
        eyebrow="Lead Directory"
        title={`${pagination.total} lead records`}
        description={`Page ${pagination.page} of ${pagination.pages}`}
      />

      {leads.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            actionLabel="Create lead"
            description="No lead matched the current filters. Clear the filters or create a new one to keep the pipeline moving."
            icon={UserPlus}
            onAction={() => router.push('/tenant/leads/create')}
            title="No leads found"
          />
        </div>
      ) : (
        <>
          <div className="ds-table-wrap mt-6">
            <table className="ds-table min-w-[1240px]">
              <thead>
                <tr>
                  <th>Lead</th>
                  <th>Source</th>
                  <th>Type</th>
                  <th>Active Branch</th>
                  <th>Course</th>
                  <th>Stage</th>
                  <th>Score</th>
                  <th>Assignment</th>
                  <th>Next Follow-up</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => {
                  const assignees = getLeadAssignees(lead);
                  const primaryAssignee = getLeadPrimaryAssignee(lead);

                  return (
                  <tr key={lead._id}>
                    <td>
                      <button
                        className="text-left"
                        onClick={() => router.push(`/tenant/leads/${lead._id}`)}
                        type="button"
                      >
                        <div className="font-semibold text-slate-900">
                          {getLeadDisplayName(lead)}
                        </div>
                        <div className="text-sm text-slate-500">{lead.email || 'No email'}</div>
                        <div className="text-sm text-slate-500">{getLeadPrimaryContact(lead)}</div>
                      </button>
                    </td>
                    <td>{lead.source || 'Unknown'}</td>
                    <td>{getEntityLabel(lead)}</td>
                    <td>
                      <div className="space-y-1">
                        <div className="font-medium text-slate-900">
                          {lead.activeBranch?.name ||
                            lead.activeBranchId?.name ||
                            lead.branchName ||
                            lead.branchId?.name ||
                            'Not set'}
                        </div>
                        <div className="text-xs text-slate-500">
                          {lead.hasTransfers
                            ? `${lead.transferCount || 0} transfer${lead.transferCount === 1 ? '' : 's'}`
                            : 'No transfers'}
                        </div>
                      </div>
                    </td>
                    <td>{lead.interestedCourse || 'Not set'}</td>
                    <td>
                      <StatusPill tone={lead.status}>
                        {lead.status?.replace(/_/g, ' ')}
                      </StatusPill>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">{lead.leadScore || 0}</span>
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                            CATEGORY_STYLES[lead.leadCategory] || 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {lead.leadCategory || 'cold'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="space-y-2">
                        <div className="text-sm font-semibold text-slate-900">
                          {primaryAssignee?.name || 'Unassigned'}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-2">
                            {assignees.slice(0, 4).map((assignee) => (
                              <div
                                key={assignee._id || assignee.id}
                                className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-slate-200 text-[11px] font-semibold text-slate-700 shadow-sm"
                                title={assignee.name}
                              >
                                {getAssigneeInitials(assignee)}
                              </div>
                            ))}
                          </div>
                          <span className="text-xs text-slate-500">
                            {assignees.length
                              ? `${assignees.length} assignee${assignees.length > 1 ? 's' : ''}`
                              : 'No collaborators'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>{lead.nextFollowUp ? formatDate(lead.nextFollowUp) : 'Not scheduled'}</td>
                    <td>
                      <div className="flex justify-end gap-2">
                        <button
                          className="ds-button-secondary px-3 py-2"
                          onClick={() => router.push(`/tenant/leads/${lead._id}`)}
                          type="button"
                        >
                          View
                        </button>
                        <button
                          className="ds-button-secondary px-3 py-2"
                          onClick={() => router.push(`/tenant/leads/${lead._id}/edit`)}
                          type="button"
                        >
                          Edit
                        </button>
                        <button
                          className="ds-button-danger px-3 py-2"
                          onClick={() => onDelete(lead._id)}
                          type="button"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex items-center justify-between gap-4 border-t border-slate-200 pt-5">
            <p className="text-sm text-slate-500">Showing {leads.length} results on this page</p>
            <div className="flex items-center gap-2">
              <button
                className="ds-button-secondary px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={pagination.page <= 1}
                onClick={() => onPageChange(pagination.page - 1)}
                type="button"
              >
                Previous
              </button>
              <button
                className="ds-button-secondary px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={pagination.page >= pagination.pages}
                onClick={() => onPageChange(pagination.page + 1)}
                type="button"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </DataTableSurface>
  );
}

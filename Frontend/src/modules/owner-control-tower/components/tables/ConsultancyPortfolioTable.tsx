'use client';

import Link from 'next/link';
import { PauseCircle, PlayCircle } from 'lucide-react';
import { DataTableSurface, SectionHeader } from '@/components/app/design-system';
import { EmptyState, StatusPill, formatCurrency } from '@/components/app/shared';
import type { ConsultancyRecord } from '../../types/owner-control.types';
import {
  formatCompactNumber,
  formatPercent,
  getConsultancyStatusTone,
  getHealthTone,
} from '../../utils/owner-control.utils';
import OwnerStatusBadge from '../owner/OwnerStatusBadge';

type ConsultancyPortfolioTableProps = {
  consultancies: ConsultancyRecord[];
  onToggleStatus?: (id: string) => void;
};

export default function ConsultancyPortfolioTable({
  consultancies,
  onToggleStatus,
}: ConsultancyPortfolioTableProps) {
  return (
    <DataTableSurface>
      <SectionHeader
        eyebrow="Consultancy Portfolio"
        title="Master table for cross-tenant supervision"
        description="Searchable, comparable, and drill-down ready for owner-level operations."
      />
      {consultancies.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No consultancies matched"
            description="Adjust the owner filters to widen the portfolio view or create a new consultancy."
          />
        </div>
      ) : (
        <div className="ds-table-wrap mt-6">
          <table className="ds-table min-w-[1720px]">
            <thead>
              <tr>
                <th>Consultancy</th>
                <th>Tenant ID</th>
                <th>Country</th>
                <th>Head Office</th>
                <th>Branches</th>
                <th>Status</th>
                <th>Setup</th>
                <th>Users</th>
                <th>Leads</th>
                <th>Students</th>
                <th>Applications</th>
                <th>Follow-up Health</th>
                <th>Automation</th>
                <th>Partner Setup</th>
                <th>Plan</th>
                <th>Revenue</th>
                <th>Last Activity</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {consultancies.map((consultancy) => (
                <tr key={consultancy.id}>
                  <td>
                    <div>
                      <p className="font-semibold text-slate-950">{consultancy.name}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {consultancy.tags.slice(0, 2).map((tag) => (
                          <OwnerStatusBadge key={tag} label={tag.replace(/-/g, ' ')} tone="info" />
                        ))}
                      </div>
                    </div>
                  </td>
                  <td>{consultancy.tenantId}</td>
                  <td>{consultancy.country}</td>
                  <td>{consultancy.headOffice}</td>
                  <td>{consultancy.metrics.branches}</td>
                  <td>
                    <StatusPill tone={getConsultancyStatusTone(consultancy.status)}>
                      {consultancy.status}
                    </StatusPill>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-950">
                        {formatPercent(consultancy.setupCompletion)}
                      </span>
                      <OwnerStatusBadge
                        label={consultancy.healthStatus}
                        tone={
                          getHealthTone(consultancy.healthStatus) === 'completed'
                            ? 'success'
                            : getHealthTone(consultancy.healthStatus) === 'pending'
                              ? 'warning'
                              : 'danger'
                        }
                      />
                    </div>
                  </td>
                  <td>{formatCompactNumber(consultancy.metrics.users)}</td>
                  <td>{formatCompactNumber(consultancy.metrics.leads)}</td>
                  <td>{formatCompactNumber(consultancy.metrics.students)}</td>
                  <td>{formatCompactNumber(consultancy.metrics.applications)}</td>
                  <td>
                    <div className="space-y-1">
                      <p className="font-semibold text-slate-900">
                        {consultancy.metrics.followUpDiscipline}%
                      </p>
                      <p className="text-xs text-slate-500">
                        {consultancy.metrics.overdueFollowUps} overdue
                      </p>
                    </div>
                  </td>
                  <td>
                    <OwnerStatusBadge
                      label={consultancy.automationStatus}
                      tone={
                        consultancy.automationStatus === 'ready'
                          ? 'success'
                          : consultancy.automationStatus === 'partial'
                            ? 'warning'
                            : 'danger'
                      }
                    />
                  </td>
                  <td>
                    <OwnerStatusBadge
                      label={consultancy.partnerSetupStatus}
                      tone={
                        consultancy.partnerSetupStatus === 'ready'
                          ? 'success'
                          : consultancy.partnerSetupStatus === 'partial'
                            ? 'warning'
                            : 'danger'
                      }
                    />
                  </td>
                  <td>{consultancy.plan}</td>
                  <td>{formatCurrency(consultancy.metrics.revenue)}</td>
                  <td>{new Date(consultancy.lastActivity).toLocaleDateString()}</td>
                  <td>
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/owner-control-tower/consultancies/${consultancy.id}`}
                        className="ds-button-secondary px-3 py-2"
                      >
                        View
                      </Link>
                      <Link
                        href={`/owner-control-tower/consultancies/${consultancy.id}?tab=overview`}
                        className="ds-button-secondary px-3 py-2"
                      >
                        Edit
                      </Link>
                      <Link
                        href={`/owner-control-tower/consultancies/${consultancy.id}`}
                        className="ds-button-primary px-3 py-2"
                      >
                        Open
                      </Link>
                      <Link
                        href={`/owner-control-tower/imports/new?tenantId=${consultancy.id}`}
                        className="ds-button-secondary px-3 py-2"
                      >
                        Import
                      </Link>
                      {onToggleStatus ? (
                        <button
                          type="button"
                          onClick={() => onToggleStatus(consultancy.id)}
                          className="ds-button-ghost px-3 py-2"
                        >
                          {consultancy.status === 'suspended' ? (
                            <>
                              <PlayCircle className="h-4 w-4" />
                              Resume
                            </>
                          ) : (
                            <>
                              <PauseCircle className="h-4 w-4" />
                              Suspend
                            </>
                          )}
                        </button>
                      ) : null}
                    </div>
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

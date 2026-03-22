'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AppShell from '@/components/app/app-shell';
import { InlineStats, SectionCard, SectionHeader } from '@/components/app/design-system';
import { ErrorState, LoadingState } from '@/components/app/shared';
import { authAPI, branchAPI, funnelAPI } from '@/src/services/api';
import FunnelBoard from '../components/FunnelBoard';
import FunnelFiltersBar from '../components/FunnelFiltersBar';
import FunnelListTable from '../components/FunnelListTable';
import StageMoveModal from '../components/StageMoveModal';

const INITIAL_FILTERS = {
  search: '',
  stageKey: '',
  assigneeScope: '',
  overdueOnly: false,
};

export default function FunnelWorkspacePage() {
  const router = useRouter();
  const [view, setView] = useState<'board' | 'list'>('board');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [board, setBoard] = useState<Record<string, any>>({});
  const [stages, setStages] = useState<any[]>([]);
  const [totals, setTotals] = useState<any>({});
  const [listLeads, setListLeads] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>({});
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [lostReasons, setLostReasons] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [draggingLead, setDraggingLead] = useState<any>(null);
  const [dragOverStageKey, setDragOverStageKey] = useState('');
  const [pendingMove, setPendingMove] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [bulkStageKey, setBulkStageKey] = useState('');
  const [bulkAssigneeId, setBulkAssigneeId] = useState('');
  const [bulkBranchId, setBulkBranchId] = useState('');
  const [bulkReason, setBulkReason] = useState('');

  const loadWorkspace = useCallback(async (nextFilters = filters) => {
    setLoading(true);
    setError('');

    try {
      const [boardResponse, listResponse, lostReasonsResponse] = await Promise.all([
        funnelAPI.getBoard(nextFilters),
        funnelAPI.getList({ ...nextFilters, page: 1, limit: 50 }),
        funnelAPI.getLostReasons(),
      ]);

      setBoard(boardResponse.data?.data?.board || boardResponse.data?.data?.pipeline || {});
      setStages(boardResponse.data?.data?.stages || []);
      setTotals(boardResponse.data?.data?.totals || {});
      setListLeads(listResponse.data?.data?.leads || []);
      setPagination(listResponse.data?.data?.pagination || {});
      setLostReasons(lostReasonsResponse.data?.data?.lostReasons || []);
    } catch (requestError: any) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to load the Funnel workspace.'
      );
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadWorkspace(INITIAL_FILTERS);
  }, [loadWorkspace]);

  useEffect(() => {
    let active = true;

    const loadMeta = async () => {
      try {
        const [usersResponse, branchesResponse] = await Promise.all([
          authAPI.getUsers(),
          branchAPI.getBranches(),
        ]);

        if (!active) {
          return;
        }

        setUsers(usersResponse.data?.data?.users || []);
        setBranches(branchesResponse.data?.data || []);
      } catch (error) {
        if (active) {
          setUsers([]);
          setBranches([]);
        }
      }
    };

    loadMeta();

    return () => {
      active = false;
    };
  }, []);

  const currentTargetStage = useMemo(
    () => stages.find((stage) => stage.key === pendingMove?.targetStageKey) || null,
    [pendingMove?.targetStageKey, stages]
  );

  const runBulkAction = async (callback: () => Promise<any>) => {
    setActionLoading(true);
    setError('');

    try {
      await callback();
      setSelectedIds([]);
      setBulkReason('');
      await loadWorkspace(filters);
    } catch (requestError: any) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to complete the Funnel action.'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleMoveLead = async (payload: any) => {
    if (!pendingMove?.lead?._id || !pendingMove?.targetStageKey) {
      return;
    }

    await runBulkAction(() =>
      funnelAPI.moveLead(pendingMove.lead._id, {
        stageKey: pendingMove.targetStageKey,
        ...payload,
      })
    );

    setPendingMove(null);
    setDraggingLead(null);
    setDragOverStageKey('');
  };

  const handleToggleSelect = (leadId: string) => {
    setSelectedIds((current) =>
      current.includes(leadId) ? current.filter((item) => item !== leadId) : [...current, leadId]
    );
  };

  const handleToggleAll = () => {
    setSelectedIds((current) =>
      current.length === listLeads.length ? [] : listLeads.map((lead) => String(lead._id))
    );
  };

  return (
    <AppShell
      title="Funnel System"
      description="Manage configurable Funnel stages, branch-aware movement, multi-assignee collaboration, follow-up SLA, and branch transfer operations from one workspace."
      actions={
        <>
          <Link className="ds-button-secondary" href="/tenant/funnel/analytics">
            Funnel Analytics
          </Link>
          <Link className="ds-button-primary" href="/tenant/funnel/settings">
            Funnel Settings
          </Link>
        </>
      }
    >
      <div className="space-y-6">
        <FunnelFiltersBar
          filters={filters}
          stages={stages}
          onChange={setFilters}
          onApply={() => loadWorkspace(filters)}
          onReset={() => {
            setFilters(INITIAL_FILTERS);
            loadWorkspace(INITIAL_FILTERS);
          }}
        />

        {loading ? <LoadingState label="Loading Funnel workspace..." /> : null}
        {!loading && error ? <ErrorState message={error} onRetry={() => loadWorkspace(filters)} /> : null}

        {!loading && !error ? (
          <>
            <InlineStats
              items={[
                { label: 'Total Leads', value: totals.totalLeads || 0, helper: 'All active Funnel records' },
                { label: 'Overdue', value: totals.overdueLeads || 0, helper: 'SLA follow-up attention required' },
                { label: 'Stages', value: stages.length, helper: 'Configurable Funnel stages' },
                { label: 'Visible Records', value: pagination.total || totals.totalLeads || 0, helper: 'Current query result set' },
              ]}
            />

            <SectionCard>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <SectionHeader
                  eyebrow="Operational Views"
                  title="Board and list"
                  description="Switch between the visual Funnel Board and the high-control list view."
                />
                <div className="flex gap-2">
                  {[
                    ['board', 'Funnel Board'],
                    ['list', 'List View'],
                  ].map(([nextView, label]) => (
                    <button
                      key={nextView}
                      type="button"
                      onClick={() => setView(nextView as 'board' | 'list')}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        view === nextView
                          ? 'bg-slate-900 text-white'
                          : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {selectedIds.length ? (
                <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
                    <p className="text-sm font-semibold text-slate-900">
                      {selectedIds.length} selected for bulk Funnel actions
                    </p>
                    <div className="grid flex-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
                      <select
                        className="ds-field"
                        value={bulkStageKey}
                        onChange={(event) => setBulkStageKey(event.target.value)}
                      >
                        <option value="">Bulk move stage</option>
                        {stages.map((stage) => (
                          <option key={stage._id} value={stage.key}>
                            {stage.name}
                          </option>
                        ))}
                      </select>
                      <select
                        className="ds-field"
                        value={bulkAssigneeId}
                        onChange={(event) => setBulkAssigneeId(event.target.value)}
                      >
                        <option value="">Bulk assign primary</option>
                        {users.map((user) => (
                          <option key={user._id} value={user._id}>
                            {user.name}
                          </option>
                        ))}
                      </select>
                      <select
                        className="ds-field"
                        value={bulkBranchId}
                        onChange={(event) => setBulkBranchId(event.target.value)}
                      >
                        <option value="">Bulk transfer branch</option>
                        {branches.map((branch) => (
                          <option key={branch._id} value={branch._id}>
                            {branch.name}
                          </option>
                        ))}
                      </select>
                      <input
                        className="ds-field"
                        placeholder="Bulk reason"
                        value={bulkReason}
                        onChange={(event) => setBulkReason(event.target.value)}
                      />
                      <div className="flex flex-wrap gap-2">
                        <button
                          className="ds-button-secondary"
                          disabled={actionLoading || !bulkStageKey}
                          onClick={() =>
                            runBulkAction(() =>
                              funnelAPI.bulkMove({
                                leadIds: selectedIds,
                                stageKey: bulkStageKey,
                                reason: bulkReason,
                              })
                            )
                          }
                          type="button"
                        >
                          Bulk move
                        </button>
                        <button
                          className="ds-button-secondary"
                          disabled={actionLoading || !bulkAssigneeId}
                          onClick={() =>
                            runBulkAction(() =>
                              funnelAPI.bulkAssign({
                                leadIds: selectedIds,
                                userIds: [bulkAssigneeId],
                                primaryAssigneeId: bulkAssigneeId,
                              })
                            )
                          }
                          type="button"
                        >
                          Bulk assign
                        </button>
                        <button
                          className="ds-button-secondary"
                          disabled={actionLoading || !bulkBranchId || !bulkReason.trim()}
                          onClick={() =>
                            runBulkAction(() =>
                              funnelAPI.bulkTransfer({
                                leadIds: selectedIds,
                                toBranchId: bulkBranchId,
                                toAssigneeId: bulkAssigneeId || undefined,
                                reason: bulkReason,
                              })
                            )
                          }
                          type="button"
                        >
                          Bulk transfer
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="mt-6">
                {view === 'board' ? (
                  <FunnelBoard
                    stages={stages}
                    board={board}
                    dragOverStageKey={dragOverStageKey}
                    disabledLeadId={actionLoading ? draggingLead?._id || '' : ''}
                    onDragOver={setDragOverStageKey}
                    onDragLeave={() => setDragOverStageKey('')}
                    onDropStage={(targetStageKey) => {
                      if (!draggingLead || draggingLead.pipelineStage === targetStageKey) {
                        setDraggingLead(null);
                        setDragOverStageKey('');
                        return;
                      }
                      setPendingMove({
                        lead: draggingLead,
                        targetStageKey,
                      });
                    }}
                    onOpenLead={(lead) => router.push(`/tenant/leads/${lead._id}`)}
                    onDragStart={(lead) => setDraggingLead(lead)}
                  />
                ) : (
                  <FunnelListTable
                    leads={listLeads}
                    pagination={pagination}
                    selectedIds={selectedIds}
                    onToggleSelect={handleToggleSelect}
                    onToggleAll={handleToggleAll}
                    onOpenLead={(lead) => router.push(`/tenant/leads/${lead._id}`)}
                  />
                )}
              </div>
            </SectionCard>
          </>
        ) : null}
      </div>

      <StageMoveModal
        open={Boolean(pendingMove)}
        lead={pendingMove?.lead}
        targetStage={currentTargetStage}
        lostReasons={lostReasons}
        submitting={actionLoading}
        onClose={() => {
          setPendingMove(null);
          setDraggingLead(null);
          setDragOverStageKey('');
        }}
        onSubmit={handleMoveLead}
      />
    </AppShell>
  );
}

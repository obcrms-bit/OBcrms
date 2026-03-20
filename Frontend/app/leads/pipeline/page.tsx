// @ts-nocheck
'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import AppShell from '@/components/app/app-shell';
import {
  CATEGORY_STYLES,
  ErrorState,
  LEAD_STAGES,
  LoadingState,
  StatusPill,
  formatDate,
} from '@/components/app/shared';
import { leadAPI } from '@/services/api';

export default function PipelinePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pipeline, setPipeline] = useState({});
  const [dragging, setDragging] = useState(null);
  const [dragOver, setDragOver] = useState('');
  const [updatingLeadId, setUpdatingLeadId] = useState('');

  const loadPipeline = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await leadAPI.getPipeline();
      setPipeline(response.data?.data?.pipeline || {});
    } catch (requestError: any) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to load the lead pipeline.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPipeline();
  }, []);

  const totalLeads = useMemo(
    () =>
      Object.values(pipeline).reduce(
        (count, stage) => count + (stage?.count || 0),
        0
      ),
    [pipeline]
  );

  const handleDrop = async (targetStage) => {
    if (!dragging || dragging.fromStage === targetStage) {
      setDragging(null);
      setDragOver('');
      return;
    }

    const { lead, fromStage } = dragging;
    setDragging(null);
    setDragOver('');
    setUpdatingLeadId(lead._id);

    setPipeline((current) => {
      const nextState = { ...current };
      nextState[fromStage] = {
        ...(current[fromStage] || {}),
        leads:
          current[fromStage]?.leads?.filter((item) => item._id !== lead._id) || [],
        count: Math.max((current[fromStage]?.count || 1) - 1, 0),
      };
      nextState[targetStage] = {
        ...(current[targetStage] || {}),
        leads: [{ ...lead, status: targetStage }, ...(current[targetStage]?.leads || [])],
        count: (current[targetStage]?.count || 0) + 1,
      };

      return nextState;
    });

    try {
      await leadAPI.updateStatus(lead._id, targetStage);
    } catch (requestError: any) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to move the lead to the new stage.'
      );
      await loadPipeline();
    } finally {
      setUpdatingLeadId('');
    }
  };

  return (
    <AppShell
      title="Lead Pipeline"
      description="Drag and drop leads across the actual production stages backed by the deployed status update endpoint."
      actions={
        <>
          <button
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            onClick={loadPipeline}
            type="button"
          >
            Refresh board
          </button>
          <Link
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            href="/leads/create"
          >
            Create lead
          </Link>
        </>
      }
    >
      {loading ? <LoadingState label="Loading production pipeline..." /> : null}
      {!loading && error ? <ErrorState message={error} onRetry={loadPipeline} /> : null}

      {!loading && !error ? (
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Pipeline Summary
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-900">
              {totalLeads} leads across {LEAD_STAGES.length} stages
            </h3>
          </div>

          <div className="overflow-x-auto">
            <div
              className="flex gap-4 pb-3"
              style={{ minWidth: `${LEAD_STAGES.length * 280}px` }}
            >
              {LEAD_STAGES.map((stage) => {
                const stageData = pipeline[stage.key] || { count: 0, leads: [] };
                const isDragTarget = dragOver === stage.key;

                return (
                  <section
                    className={`w-[260px] flex-shrink-0 rounded-[2rem] border p-4 shadow-sm transition ${
                      isDragTarget
                        ? 'border-teal-400 bg-teal-50'
                        : 'border-slate-200 bg-white'
                    }`}
                    key={stage.key}
                    onDragLeave={() => setDragOver('')}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setDragOver(stage.key);
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      handleDrop(stage.key);
                    }}
                  >
                    <div className="flex items-center justify-between gap-3 pb-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                          {stage.label}
                        </p>
                        <p className="mt-2 text-2xl font-semibold text-slate-900">
                          {stageData.count || 0}
                        </p>
                      </div>
                      <StatusPill tone={stage.key}>{stage.label}</StatusPill>
                    </div>

                    <div className="space-y-3">
                      {stageData.leads?.map((lead) => (
                        <article
                          className={`cursor-grab rounded-3xl border border-slate-200 bg-slate-50 p-4 transition ${
                            updatingLeadId === lead._id ? 'opacity-50' : 'hover:border-slate-300'
                          }`}
                          draggable
                          key={lead._id}
                          onDragStart={() => setDragging({ lead, fromStage: stage.key })}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-slate-900">
                                {lead.firstName} {lead.lastName}
                              </p>
                              <p className="mt-1 text-sm text-slate-500">{lead.email}</p>
                            </div>
                            <span
                              className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                                CATEGORY_STYLES[lead.leadCategory] ||
                                'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {lead.leadScore || 0}
                            </span>
                          </div>

                          <div className="mt-4 space-y-2 text-sm text-slate-500">
                            <p>{lead.phone || 'No phone'}</p>
                            <p>{lead.assignedCounsellor?.name || 'Unassigned counsellor'}</p>
                            <p>
                              Next follow-up:{' '}
                              {lead.nextFollowUp ? formatDate(lead.nextFollowUp) : 'Not set'}
                            </p>
                          </div>
                        </article>
                      ))}

                      {!stageData.leads?.length ? (
                        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-400">
                          Drop a lead here
                        </div>
                      ) : null}
                    </div>
                  </section>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}

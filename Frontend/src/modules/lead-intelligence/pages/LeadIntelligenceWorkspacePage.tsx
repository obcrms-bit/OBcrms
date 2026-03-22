// @ts-nocheck
'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/app/app-shell';
import { InlineStats, SectionCard, SectionHeader } from '@/components/app/design-system';
import { ErrorState, LoadingState } from '@/components/app/shared';
import { authAPI, branchAPI, leadIntelligenceAPI } from '@/src/services/api';
import LeadHealthPills from '../components/LeadHealthPills';

const INITIAL_COUNTRY_RULE = {
  id: '',
  countryName: '',
  countryCode: '',
  defaultBranchId: '',
  primaryAssigneeId: '',
  secondaryAssigneeIds: [] as string[],
  assignmentStrategy: 'primary_first',
  fallbackStrategy: 'lowest_active_load',
  active: true,
};

const formatLabel = (value: string) =>
  String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());

const prettyJson = (value: any) => JSON.stringify(value || {}, null, 2);

export default function LeadIntelligenceWorkspacePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [overview, setOverview] = useState<any>(null);
  const [settingsBundle, setSettingsBundle] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [countryRuleDraft, setCountryRuleDraft] = useState<any>(INITIAL_COUNTRY_RULE);
  const [settingsDraft, setSettingsDraft] = useState<any>(null);
  const [jsonDrafts, setJsonDrafts] = useState({
    scoringWeights: '{}',
    sourceWeights: '{}',
    priorityThresholds: '{}',
    temperatureThresholds: '{}',
  });

  const loadWorkspace = async () => {
    setLoading(true);
    setError('');

    try {
      const [overviewResponse, settingsResponse, usersResponse, branchesResponse] =
        await Promise.all([
          leadIntelligenceAPI.getOverview(),
          leadIntelligenceAPI.getSettings(),
          authAPI.getUsers(),
          branchAPI.getBranches(),
        ]);

      const nextSettingsBundle = settingsResponse.data?.data || {};
      const nextSettings = nextSettingsBundle.settings || {};

      setOverview(overviewResponse.data?.data || null);
      setSettingsBundle(nextSettingsBundle);
      setSettingsDraft(nextSettings);
      setJsonDrafts({
        scoringWeights: prettyJson(nextSettings.scoringWeights),
        sourceWeights: prettyJson(nextSettings.sourceWeights),
        priorityThresholds: prettyJson(nextSettings.priorityThresholds),
        temperatureThresholds: prettyJson(nextSettings.temperatureThresholds),
      });
      setUsers(usersResponse.data?.data?.users || []);
      setBranches(branchesResponse.data?.data || []);
    } catch (requestError: any) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to load the AI lead system.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspace();
  }, []);

  const runSave = async (callback: () => Promise<any>) => {
    setSaving(true);
    setError('');
    try {
      await callback();
      await loadWorkspace();
    } catch (requestError: any) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to save AI lead system changes.'
      );
    } finally {
      setSaving(false);
    }
  };

  const saveSettings = async () => {
    await runSave(async () => {
      await leadIntelligenceAPI.updateSettings({
        ...settingsDraft,
        scoringWeights: JSON.parse(jsonDrafts.scoringWeights || '{}'),
        sourceWeights: JSON.parse(jsonDrafts.sourceWeights || '{}'),
        priorityThresholds: JSON.parse(jsonDrafts.priorityThresholds || '{}'),
        temperatureThresholds: JSON.parse(jsonDrafts.temperatureThresholds || '{}'),
      });
    });
  };

  return (
    <AppShell
      title="AI Lead System"
      description="Manage explainable scoring, urgency, temperature, and country-based assignment from one tenant-safe control surface."
    >
      {loading ? <LoadingState label="Loading AI lead system..." /> : null}
      {!loading && error ? <ErrorState message={error} onRetry={loadWorkspace} /> : null}

      {!loading && !error && overview && settingsDraft ? (
        <div className="space-y-6">
          <InlineStats
            items={[
              { label: 'Hot Leads', value: overview.widgets?.hotLeads || 0, helper: 'Hot + high-intent' },
              { label: 'Urgent Leads', value: overview.widgets?.urgentLeads || 0, helper: 'Immediate action required' },
              { label: 'Stale Leads', value: overview.widgets?.staleLeads || 0, helper: 'Cooling or inactive' },
              { label: 'Reactivation', value: overview.widgets?.reactivationCandidates || 0, helper: 'Worth re-engaging' },
            ]}
          />

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
            <SectionCard>
              <SectionHeader
                eyebrow="Overview"
                title="Operational intelligence"
                description="Surface the leads, recommendations, and management insights the team should act on first."
              />

              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">Priority queue</p>
                  <div className="mt-4 space-y-3">
                    {(overview.topPriorityLeads || []).slice(0, 6).map((lead: any) => (
                      <div key={lead._id} className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="font-semibold text-slate-900">{lead.name || lead.fullName}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          {lead.activeBranchId?.name || lead.branchName || 'Unassigned branch'}
                        </p>
                        <div className="mt-3">
                          <LeadHealthPills
                            score={lead.aiScore}
                            label={lead.aiScoreLabel}
                            temperature={lead.leadTemperature}
                            priority={lead.priority}
                            nextAction={lead.metadata?.leadIntelligence?.recommendedNextAction}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">Insights</p>
                  <div className="mt-4 space-y-3">
                    {(overview.insights || []).map((insight: any) => (
                      <div key={insight.title} className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="font-semibold text-slate-900">{insight.title}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{insight.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard>
              <SectionHeader
                eyebrow="Execution Modes"
                title="Scoring and routing controls"
                description="Choose when the AI layer suggests, waits for approval, or applies changes automatically."
              />

              <div className="mt-6 space-y-4">
                {[
                  ['autoAssignmentMode', 'Auto assignment mode', ['manual', 'approval', 'automatic']],
                  ['branchRoutingMode', 'Branch routing mode', ['manual', 'approval', 'automatic']],
                  ['recommendationMode', 'Recommendation mode', ['manual', 'approval', 'automatic']],
                  ['fallbackAssignmentStrategy', 'Fallback assignment strategy', ['lowest_active_load', 'best_conversion_history', 'round_robin', 'priority_queue']],
                  ['fallbackBranchRoutingStrategy', 'Fallback branch routing', ['best_conversion_history', 'lowest_backlog', 'country_rule', 'manual']],
                ].map(([field, label, options]) => (
                  <label key={String(field)} className="block space-y-2">
                    <span className="text-sm font-semibold text-slate-700">{label}</span>
                    <select
                      className="ds-field"
                      value={settingsDraft[field]}
                      onChange={(event) =>
                        setSettingsDraft((current: any) => ({
                          ...current,
                          [field]: event.target.value,
                        }))
                      }
                    >
                      {(options as string[]).map((option) => (
                        <option key={option} value={option}>
                          {formatLabel(option)}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
            </SectionCard>
          </div>

          <SectionCard>
            <SectionHeader
              eyebrow="Scoring JSON"
              title="Editable weight maps"
              description="Keep the scoring layer configurable per tenant without hardcoded source or priority logic."
            />

            <div className="mt-6 grid gap-4 xl:grid-cols-4">
              {[
                ['scoringWeights', 'Scoring weights'],
                ['sourceWeights', 'Source weights'],
                ['priorityThresholds', 'Priority thresholds'],
                ['temperatureThresholds', 'Temperature thresholds'],
              ].map(([field, label]) => (
                <label key={String(field)} className="block space-y-2">
                  <span className="text-sm font-semibold text-slate-700">{label}</span>
                  <textarea
                    rows={12}
                    className="ds-field"
                    value={jsonDrafts[field]}
                    onChange={(event) =>
                      setJsonDrafts((current) => ({
                        ...current,
                        [field]: event.target.value,
                      }))
                    }
                  />
                </label>
              ))}
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={Boolean(settingsDraft.explainabilityVisible)}
                  onChange={(event) =>
                    setSettingsDraft((current: any) => ({
                      ...current,
                      explainabilityVisible: event.target.checked,
                    }))
                  }
                />
                Show explainability in tenant UI
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={Boolean(settingsDraft.autoReassignOnCountryChange)}
                  onChange={(event) =>
                    setSettingsDraft((current: any) => ({
                      ...current,
                      autoReassignOnCountryChange: event.target.checked,
                    }))
                  }
                />
                Reassign automatically on country change
              </label>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={saveSettings}
                className="ds-button-primary"
              >
                Save AI settings
              </button>
            </div>
          </SectionCard>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
            <SectionCard>
              <SectionHeader
                eyebrow="Country Assignment"
                title="Country-based auto assignment"
                description="Keep one lead with one primary owner plus collaborators, all configured by interested country mapping."
              />

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {(settingsBundle.countryRules || []).map((rule: any) => (
                  <div key={rule._id} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{rule.countryName}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          {rule.defaultBranchId?.name || 'No default branch'}
                        </p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                        {formatLabel(rule.assignmentStrategy)}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-slate-600">
                      Primary: {rule.primaryAssigneeId?.name || 'Not set'}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      Secondary: {(rule.secondaryAssigneeIds || []).map((item: any) => item.name).join(', ') || 'None'}
                    </p>
                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setCountryRuleDraft({
                            id: rule._id,
                            countryName: rule.countryName,
                            countryCode: rule.countryCode || '',
                            defaultBranchId: rule.defaultBranchId?._id || '',
                            primaryAssigneeId: rule.primaryAssigneeId?._id || '',
                            secondaryAssigneeIds: (rule.secondaryAssigneeIds || []).map((item: any) => item._id),
                            assignmentStrategy: rule.assignmentStrategy,
                            fallbackStrategy: rule.fallbackStrategy,
                            active: rule.active !== false,
                          })
                        }
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() =>
                          runSave(() => leadIntelligenceAPI.deleteCountryRule(rule._id))
                        }
                        className="rounded-xl border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard>
              <SectionHeader
                eyebrow="Rule Editor"
                title={countryRuleDraft.id ? 'Edit country rule' : 'Add country rule'}
                description="Map country to branch, primary assignee, collaborator assignees, and fallback strategy."
              />

              <div className="mt-6 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <input
                    className="ds-field"
                    placeholder="Country name"
                    value={countryRuleDraft.countryName}
                    onChange={(event) =>
                      setCountryRuleDraft((current: any) => ({
                        ...current,
                        countryName: event.target.value,
                      }))
                    }
                  />
                  <input
                    className="ds-field"
                    placeholder="Country code"
                    value={countryRuleDraft.countryCode}
                    onChange={(event) =>
                      setCountryRuleDraft((current: any) => ({
                        ...current,
                        countryCode: event.target.value,
                      }))
                    }
                  />
                </div>

                <select
                  className="ds-field"
                  value={countryRuleDraft.defaultBranchId}
                  onChange={(event) =>
                    setCountryRuleDraft((current: any) => ({
                      ...current,
                      defaultBranchId: event.target.value,
                    }))
                  }
                >
                  <option value="">No default branch</option>
                  {branches.map((branch) => (
                    <option key={branch._id} value={branch._id}>
                      {branch.name}
                    </option>
                  ))}
                </select>

                <select
                  className="ds-field"
                  value={countryRuleDraft.primaryAssigneeId}
                  onChange={(event) =>
                    setCountryRuleDraft((current: any) => ({
                      ...current,
                      primaryAssigneeId: event.target.value,
                    }))
                  }
                >
                  <option value="">No primary assignee</option>
                  {users.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name}
                    </option>
                  ))}
                </select>

                <div className="max-h-44 space-y-2 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  {users.map((user) => {
                    const checked = countryRuleDraft.secondaryAssigneeIds.includes(user._id);
                    return (
                      <label key={user._id} className="flex items-center gap-3 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setCountryRuleDraft((current: any) => ({
                              ...current,
                              secondaryAssigneeIds: checked
                                ? current.secondaryAssigneeIds.filter((item: string) => item !== user._id)
                                : [...current.secondaryAssigneeIds, user._id],
                            }))
                          }
                        />
                        {user.name}
                      </label>
                    );
                  })}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <select
                    className="ds-field"
                    value={countryRuleDraft.assignmentStrategy}
                    onChange={(event) =>
                      setCountryRuleDraft((current: any) => ({
                        ...current,
                        assignmentStrategy: event.target.value,
                      }))
                    }
                  >
                    {['primary_first', 'round_robin', 'lowest_active_load', 'best_conversion_history', 'priority_queue', 'manual'].map((option) => (
                      <option key={option} value={option}>
                        {formatLabel(option)}
                      </option>
                    ))}
                  </select>
                  <select
                    className="ds-field"
                    value={countryRuleDraft.fallbackStrategy}
                    onChange={(event) =>
                      setCountryRuleDraft((current: any) => ({
                        ...current,
                        fallbackStrategy: event.target.value,
                      }))
                    }
                  >
                    {['lowest_active_load', 'best_conversion_history', 'round_robin', 'destination_specialist', 'branch_default_assignee', 'manual'].map((option) => (
                      <option key={option} value={option}>
                        {formatLabel(option)}
                      </option>
                    ))}
                  </select>
                </div>

                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={countryRuleDraft.active}
                    onChange={(event) =>
                      setCountryRuleDraft((current: any) => ({
                        ...current,
                        active: event.target.checked,
                      }))
                    }
                  />
                  Rule active
                </label>

                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={saving || !countryRuleDraft.countryName.trim()}
                    onClick={() =>
                      runSave(async () => {
                        await leadIntelligenceAPI.saveCountryRule(countryRuleDraft);
                        setCountryRuleDraft(INITIAL_COUNTRY_RULE);
                      })
                    }
                    className="ds-button-primary"
                  >
                    Save country rule
                  </button>
                  <button
                    type="button"
                    onClick={() => setCountryRuleDraft(INITIAL_COUNTRY_RULE)}
                    className="ds-button-secondary"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </SectionCard>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}

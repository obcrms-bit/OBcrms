'use client';

import { useEffect, useState } from 'react';
import { Bot, Workflow } from 'lucide-react';
import AppShell from '@/components/app/app-shell';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  StatusPill,
  formatDateTime,
} from '@/components/app/shared';
import { platformAPI } from '@/src/services/api';

const inputClassName =
  'w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:bg-white';

const defaultForm = {
  name: '',
  module: 'leads',
  triggerEvent: 'lead.created',
  conditionsJson: '[\n  {\n    "field": "sourceType",\n    "operator": "equals",\n    "value": "website_form"\n  }\n]',
  actionsJson:
    '[\n  {\n    "type": "assign_country_counsellor",\n    "config": {}\n  },\n  {\n    "type": "create_followup",\n    "config": { "offsetHours": 8, "method": "call" }\n  }\n]',
  isActive: true,
};

export default function AutomationsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [rules, setRules] = useState([]);
  const [logs, setLogs] = useState([]);
  const [form, setForm] = useState(defaultForm);

  const loadWorkspace = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await platformAPI.getAutomations();
      setRules(response.data?.data?.rules || []);
      setLogs(response.data?.data?.logs || []);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to load automations.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspace();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      await platformAPI.saveAutomation({
        ...form,
        conditions: JSON.parse(form.conditionsJson),
        actions: JSON.parse(form.actionsJson),
      });
      setForm(defaultForm);
      await loadWorkspace();
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to save automation rule.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell
      title="Automations"
      description="Create event-driven rules for lead assignment, follow-up scheduling, escalation, and notification workflows."
    >
      {loading ? <LoadingState label="Loading automations..." /> : null}
      {!loading ? (
        <div className="space-y-6">
          {error ? <ErrorState message={error} onRetry={loadWorkspace} /> : null}

          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <form className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm" onSubmit={handleSubmit}>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Rule Builder
                </p>
                <h3 className="mt-2 text-xl font-semibold text-slate-900">
                  Automation blueprint
                </h3>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {[
                  ['name', 'Rule name'],
                  ['module', 'Module'],
                  ['triggerEvent', 'Trigger event'],
                ].map(([field, label]) => (
                  <label key={field} className="block space-y-2">
                    <span className="text-sm font-semibold text-slate-700">{label}</span>
                    <input
                      className={inputClassName}
                      value={form[field]}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          [field]: event.target.value,
                        }))
                      }
                    />
                  </label>
                ))}
              </div>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-700">Conditions (JSON)</span>
                <textarea
                  rows={9}
                  className={inputClassName}
                  value={form.conditionsJson}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      conditionsJson: event.target.value,
                    }))
                  }
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-700">Actions (JSON)</span>
                <textarea
                  rows={11}
                  className={inputClassName}
                  value={form.actionsJson}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      actionsJson: event.target.value,
                    }))
                  }
                />
              </label>

              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      isActive: event.target.checked,
                    }))
                  }
                />
                Activate immediately
              </label>

              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Save Automation'}
              </button>
            </form>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Active Rules
              </p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">
                Automation catalog
              </h3>
              <div className="mt-6 space-y-4">
                {rules.length ? (
                  rules.map((rule) => (
                    <div key={rule._id} className="rounded-3xl border border-slate-200 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">{rule.name}</p>
                          <p className="mt-1 text-sm text-slate-500">
                            {rule.module} / {rule.triggerEvent}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <StatusPill tone={rule.isActive ? 'completed' : 'lost'}>
                            {rule.isActive ? 'Active' : 'Inactive'}
                          </StatusPill>
                          <StatusPill tone="pending">{rule.runCount || 0} runs</StatusPill>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <div className="rounded-2xl bg-slate-50 p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
                            Conditions
                          </p>
                          <pre className="mt-3 overflow-x-auto text-xs text-slate-700">
                            {JSON.stringify(rule.conditions || [], null, 2)}
                          </pre>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
                            Actions
                          </p>
                          <pre className="mt-3 overflow-x-auto text-xs text-slate-700">
                            {JSON.stringify(rule.actions || [], null, 2)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState
                    icon={Workflow}
                    title="No automation rules yet"
                    description="Create event-driven rules for lead.created, followup.missed, public_form.submitted, and more."
                  />
                )}
              </div>
            </section>
          </div>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Automation Logs
            </p>
            <h3 className="mt-2 text-xl font-semibold text-slate-900">
              Recent execution trail
            </h3>
            <div className="mt-6 space-y-4">
              {logs.length ? (
                logs.map((log) => (
                  <div key={log._id} className="rounded-3xl border border-slate-200 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">{log.message}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          {log.module} / {formatDateTime(log.runAt)}
                        </p>
                      </div>
                      <StatusPill tone={log.status === 'failure' ? 'lost' : log.status === 'skipped' ? 'pending' : 'completed'}>
                        {log.status}
                      </StatusPill>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  icon={Bot}
                  title="No automation logs yet"
                  description="Rule runs will appear here once live events start triggering automations."
                />
              )}
            </div>
          </section>
        </div>
      ) : null}
    </AppShell>
  );
}

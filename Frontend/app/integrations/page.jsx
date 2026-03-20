'use client';

import { useEffect, useState } from 'react';
import { Globe2, PlugZap } from 'lucide-react';
import AppShell from '@/components/app/app-shell';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  StatusPill,
} from '@/components/app/shared';
import { platformAPI } from '@/src/services/api';

const inputClassName =
  'w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:bg-white';

const defaultIntegrationForm = {
  type: 'email',
  provider: 'smtp',
  label: 'SMTP Mailer',
  isEnabled: true,
  configJson: '{\n  "host": "",\n  "port": 587,\n  "user": "",\n  "pass": ""\n}',
};

const defaultWebsiteForm = {
  formId: '',
  widgetType: 'inline_form',
  embedMode: 'iframe',
  targetCountries: 'Australia, UK',
  sourceLabel: 'Website',
  campaignTag: '',
  allowedDomains: '',
  webhookUrl: '',
  themeMode: 'tenant',
  widgetConfigJson: '{\n  "ctaLabel": "Talk to our counsellors"\n}',
};

export default function IntegrationsPage() {
  const [loading, setLoading] = useState(true);
  const [savingIntegration, setSavingIntegration] = useState(false);
  const [savingWebsite, setSavingWebsite] = useState(false);
  const [error, setError] = useState('');
  const [integrations, setIntegrations] = useState([]);
  const [websiteIntegrations, setWebsiteIntegrations] = useState([]);
  const [forms, setForms] = useState([]);
  const [integrationForm, setIntegrationForm] = useState(defaultIntegrationForm);
  const [websiteForm, setWebsiteForm] = useState(defaultWebsiteForm);

  const loadWorkspace = async () => {
    setLoading(true);
    setError('');
    try {
      const [integrationsResponse, websiteResponse, formsResponse] = await Promise.all([
        platformAPI.getIntegrations(),
        platformAPI.getWebsiteIntegrations(),
        platformAPI.getForms(),
      ]);

      setIntegrations(integrationsResponse.data?.data?.integrations || []);
      setWebsiteIntegrations(websiteResponse.data?.data?.integrations || []);
      setForms(formsResponse.data?.data?.forms || []);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to load integrations workspace.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspace();
  }, []);

  const handleSaveIntegration = async (event) => {
    event.preventDefault();
    setSavingIntegration(true);
    setError('');

    try {
      await platformAPI.saveIntegration({
        ...integrationForm,
        config: JSON.parse(integrationForm.configJson),
      });
      setIntegrationForm(defaultIntegrationForm);
      await loadWorkspace();
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to save integration.'
      );
    } finally {
      setSavingIntegration(false);
    }
  };

  const handleSaveWebsiteIntegration = async (event) => {
    event.preventDefault();
    setSavingWebsite(true);
    setError('');

    try {
      await platformAPI.saveWebsiteIntegration({
        ...websiteForm,
        widgetConfig: JSON.parse(websiteForm.widgetConfigJson),
      });
      setWebsiteForm(defaultWebsiteForm);
      await loadWorkspace();
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to save website integration.'
      );
    } finally {
      setSavingWebsite(false);
    }
  };

  return (
    <AppShell
      title="Integrations"
      description="Configure communication, payments, storage, and website lead capture so tenant data flows into the CRM in a controlled, auditable way."
    >
      {loading ? <LoadingState label="Loading integrations..." /> : null}
      {!loading ? (
        <div className="space-y-6">
          {error ? <ErrorState message={error} onRetry={loadWorkspace} /> : null}

          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <form className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm" onSubmit={handleSaveIntegration}>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Core Integrations
                </p>
                <h3 className="mt-2 text-xl font-semibold text-slate-900">
                  Provider configuration
                </h3>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {[
                  ['type', 'Type'],
                  ['provider', 'Provider'],
                  ['label', 'Label'],
                ].map(([field, label]) => (
                  <label key={field} className="block space-y-2">
                    <span className="text-sm font-semibold text-slate-700">{label}</span>
                    <input
                      className={inputClassName}
                      value={integrationForm[field]}
                      onChange={(event) =>
                        setIntegrationForm((current) => ({
                          ...current,
                          [field]: event.target.value,
                        }))
                      }
                    />
                  </label>
                ))}
              </div>

              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={integrationForm.isEnabled}
                  onChange={(event) =>
                    setIntegrationForm((current) => ({
                      ...current,
                      isEnabled: event.target.checked,
                    }))
                  }
                />
                Enable provider
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-700">Provider config (JSON)</span>
                <textarea
                  rows={10}
                  className={inputClassName}
                  value={integrationForm.configJson}
                  onChange={(event) =>
                    setIntegrationForm((current) => ({
                      ...current,
                      configJson: event.target.value,
                    }))
                  }
                />
              </label>

              <button
                type="submit"
                disabled={savingIntegration}
                className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
              >
                {savingIntegration ? 'Saving...' : 'Save Integration'}
              </button>
            </form>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Connected Providers
              </p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">
                Communication and infrastructure layer
              </h3>
              <div className="mt-6 space-y-4">
                {integrations.length ? (
                  integrations.map((integration) => (
                    <div key={integration._id} className="rounded-3xl border border-slate-200 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">{integration.label}</p>
                          <p className="mt-1 text-sm text-slate-500">
                            {integration.type} via {integration.provider}
                          </p>
                        </div>
                        <StatusPill tone={integration.isEnabled ? 'completed' : 'lost'}>
                          {integration.isEnabled ? 'Enabled' : 'Disabled'}
                        </StatusPill>
                      </div>
                      <pre className="mt-4 overflow-x-auto rounded-2xl bg-slate-950 p-4 text-xs text-slate-100">
                        {JSON.stringify(integration.config || {}, null, 2)}
                      </pre>
                    </div>
                  ))
                ) : (
                  <EmptyState
                    icon={PlugZap}
                    title="No integrations saved"
                    description="Add SMTP, storage, payment, webhook, or calendar providers to make the SaaS workspace operational."
                  />
                )}
              </div>
            </section>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
            <form className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm" onSubmit={handleSaveWebsiteIntegration}>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Website Integration
                </p>
                <h3 className="mt-2 text-xl font-semibold text-slate-900">
                  Embed website capture widgets
                </h3>
              </div>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-700">Public form</span>
                <select
                  className={inputClassName}
                  value={websiteForm.formId}
                  onChange={(event) =>
                    setWebsiteForm((current) => ({
                      ...current,
                      formId: event.target.value,
                    }))
                  }
                >
                  <option value="">Select public form</option>
                  {forms.map((form) => (
                    <option key={form._id} value={form._id}>
                      {form.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                {[
                  ['widgetType', 'Widget type'],
                  ['embedMode', 'Embed mode'],
                  ['sourceLabel', 'Source label'],
                  ['campaignTag', 'Campaign tag'],
                  ['targetCountries', 'Target countries'],
                  ['allowedDomains', 'Allowed domains'],
                ].map(([field, label]) => (
                  <label key={field} className="block space-y-2">
                    <span className="text-sm font-semibold text-slate-700">{label}</span>
                    <input
                      className={inputClassName}
                      value={websiteForm[field]}
                      onChange={(event) =>
                        setWebsiteForm((current) => ({
                          ...current,
                          [field]: event.target.value,
                        }))
                      }
                    />
                  </label>
                ))}
              </div>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-700">Webhook URL</span>
                <input
                  className={inputClassName}
                  value={websiteForm.webhookUrl}
                  onChange={(event) =>
                    setWebsiteForm((current) => ({
                      ...current,
                      webhookUrl: event.target.value,
                    }))
                  }
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-700">Widget config (JSON)</span>
                <textarea
                  rows={8}
                  className={inputClassName}
                  value={websiteForm.widgetConfigJson}
                  onChange={(event) =>
                    setWebsiteForm((current) => ({
                      ...current,
                      widgetConfigJson: event.target.value,
                    }))
                  }
                />
              </label>

              <button
                type="submit"
                disabled={savingWebsite}
                className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
              >
                {savingWebsite ? 'Saving...' : 'Save Website Integration'}
              </button>
            </form>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Embed Snippets
              </p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">
                Website-ready outputs
              </h3>
              <div className="mt-6 space-y-4">
                {websiteIntegrations.length ? (
                  websiteIntegrations.map((integration) => (
                    <div key={integration._id} className="rounded-3xl border border-slate-200 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {integration.formId?.name || 'Website widget'}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {integration.widgetType} / {integration.embedMode}
                          </p>
                        </div>
                        <StatusPill tone={integration.isActive ? 'completed' : 'lost'}>
                          {integration.isActive ? 'Active' : 'Inactive'}
                        </StatusPill>
                      </div>
                      <pre className="mt-4 overflow-x-auto rounded-2xl bg-slate-950 p-4 text-xs text-slate-100">
                        {integration.embedSnippet}
                      </pre>
                    </div>
                  ))
                ) : (
                  <EmptyState
                    icon={Globe2}
                    title="No website integrations yet"
                    description="Generate iframe, popup, or script snippets and install them on consultancy landing pages."
                  />
                )}
              </div>
            </section>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}

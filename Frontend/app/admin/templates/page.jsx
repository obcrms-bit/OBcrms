'use client';

import { useEffect, useMemo, useState } from 'react';
import { ErrorState, LoadingState, StatusPill } from '@/components/app/shared';
import { superAdminAPI } from '@/src/services/api';

const inputClassName =
  'w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:bg-white';

const emptyTemplateForm = {
  key: '',
  name: '',
  category: 'custom',
  description: '',
  countriesText: '',
  tagsText: '',
  leadStagesText: 'Enquiry, Counselling, Docs, Visa',
  applicationStagesText: 'Draft, Submitted, Offer, Visa',
  checklistText: 'Passport, Transcript, English Score',
  primaryColor: '#0f766e',
  secondaryColor: '#0f172a',
  accentColor: '#2dd4bf',
  fontFamily: 'DM Sans',
  publicForms: true,
  websiteIntegration: true,
  qrForms: true,
  advancedWorkflows: true,
  automations: true,
};

const emptyBillingPlanForm = {
  key: '',
  name: '',
  description: '',
  priceMonthly: 0,
  priceYearly: 0,
  userLimit: 10,
  branchLimit: 2,
  reports: true,
  publicForms: true,
  websiteIntegration: true,
  qrForms: false,
  automations: false,
  advancedWorkflows: false,
  customBranding: false,
};

export default function SuperAdminTemplatesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [templates, setTemplates] = useState([]);
  const [plans, setPlans] = useState([]);
  const [templateForm, setTemplateForm] = useState(emptyTemplateForm);
  const [billingPlanForm, setBillingPlanForm] = useState(emptyBillingPlanForm);

  const loadConfig = async () => {
    setLoading(true);
    setError('');
    try {
      const [templatesResponse, plansResponse] = await Promise.all([
        superAdminAPI.getTemplates(),
        superAdminAPI.getBillingPlans(),
      ]);
      setTemplates(templatesResponse.data?.data?.templates || []);
      setPlans(plansResponse.data?.data?.plans || []);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to load templates and billing plans.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const featureKeys = useMemo(
    () => ['reports', 'publicForms', 'websiteIntegration', 'qrForms', 'automations', 'advancedWorkflows', 'customBranding'],
    []
  );

  const saveTemplate = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await superAdminAPI.saveTemplate({
        key: templateForm.key,
        name: templateForm.name,
        category: templateForm.category,
        description: templateForm.description,
        countries: templateForm.countriesText.split(',').map((item) => item.trim()).filter(Boolean),
        tags: templateForm.tagsText.split(',').map((item) => item.trim()).filter(Boolean),
        configuration: {
          branding: {
            primaryColor: templateForm.primaryColor,
            secondaryColor: templateForm.secondaryColor,
            accentColor: templateForm.accentColor,
            fontFamily: templateForm.fontFamily,
          },
          workflows: [
            {
              country:
                templateForm.countriesText.split(',').map((item) => item.trim()).filter(Boolean)[0] ||
                'Global',
              leadStages: templateForm.leadStagesText.split(',').map((item) => item.trim()).filter(Boolean),
              applicationStages: templateForm.applicationStagesText.split(',').map((item) => item.trim()).filter(Boolean),
              documentChecklist: templateForm.checklistText.split(',').map((item) => item.trim()).filter(Boolean),
            },
          ],
          featureFlags: Object.fromEntries(featureKeys.map((key) => [key, Boolean(templateForm[key])])),
        },
      });
      setTemplateForm(emptyTemplateForm);
      await loadConfig();
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to save template.'
      );
    } finally {
      setSaving(false);
    }
  };

  const saveBillingPlan = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await superAdminAPI.saveBillingPlan({
        key: billingPlanForm.key,
        name: billingPlanForm.name,
        description: billingPlanForm.description,
        priceMonthly: Number(billingPlanForm.priceMonthly || 0),
        priceYearly: Number(billingPlanForm.priceYearly || 0),
        userLimit: Number(billingPlanForm.userLimit || 0),
        branchLimit: Number(billingPlanForm.branchLimit || 0),
        featureAccess: Object.fromEntries(featureKeys.map((key) => [key, Boolean(billingPlanForm[key])])),
      });
      setBillingPlanForm(emptyBillingPlanForm);
      await loadConfig();
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to save billing plan.'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingState label="Loading template library..." />;
  }

  return (
    <div className="space-y-8">
      {error ? <ErrorState message={error} onRetry={loadConfig} /> : null}

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-teal-700">
          Template System
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          Reusable tenant templates and billing plans
        </h1>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
          Build repeatable onboarding blueprints for regions, service lines, and pricing tiers so
          most tenant setup work stays in config rather than code.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Template Library</h2>
          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            {templates.map((template) => (
              <article key={template._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{template.name}</p>
                    <p className="mt-1 text-sm text-slate-500">{template.description}</p>
                  </div>
                  <StatusPill tone="converted">{template.usageCount || 0} uses</StatusPill>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(template.countries || []).slice(0, 4).map((country) => (
                    <StatusPill key={country} tone="pending">
                      {country}
                    </StatusPill>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Create / Update Template</h2>
          <form className="mt-5 space-y-4" onSubmit={saveTemplate}>
            <div className="grid gap-4 md:grid-cols-2">
              <input className={inputClassName} placeholder="Template key" value={templateForm.key} onChange={(event) => setTemplateForm((current) => ({ ...current, key: event.target.value }))} />
              <input className={inputClassName} placeholder="Template name" value={templateForm.name} onChange={(event) => setTemplateForm((current) => ({ ...current, name: event.target.value }))} />
              <select className={inputClassName} value={templateForm.category} onChange={(event) => setTemplateForm((current) => ({ ...current, category: event.target.value }))}>
                <option value="custom">Custom</option>
                <option value="global">Global</option>
                <option value="regional">Regional</option>
                <option value="test_prep">Test Prep</option>
                <option value="consultancy">Consultancy</option>
              </select>
              <input className={inputClassName} placeholder="Countries (comma separated)" value={templateForm.countriesText} onChange={(event) => setTemplateForm((current) => ({ ...current, countriesText: event.target.value }))} />
            </div>
            <textarea className={inputClassName} rows={3} placeholder="Description" value={templateForm.description} onChange={(event) => setTemplateForm((current) => ({ ...current, description: event.target.value }))} />
            <input className={inputClassName} placeholder="Tags (comma separated)" value={templateForm.tagsText} onChange={(event) => setTemplateForm((current) => ({ ...current, tagsText: event.target.value }))} />
            <textarea className={inputClassName} rows={3} placeholder="Lead stages" value={templateForm.leadStagesText} onChange={(event) => setTemplateForm((current) => ({ ...current, leadStagesText: event.target.value }))} />
            <textarea className={inputClassName} rows={3} placeholder="Application stages" value={templateForm.applicationStagesText} onChange={(event) => setTemplateForm((current) => ({ ...current, applicationStagesText: event.target.value }))} />
            <textarea className={inputClassName} rows={3} placeholder="Document checklist" value={templateForm.checklistText} onChange={(event) => setTemplateForm((current) => ({ ...current, checklistText: event.target.value }))} />
            <div className="grid gap-4 md:grid-cols-2">
              <input className={inputClassName} placeholder="Primary color" value={templateForm.primaryColor} onChange={(event) => setTemplateForm((current) => ({ ...current, primaryColor: event.target.value }))} />
              <input className={inputClassName} placeholder="Secondary color" value={templateForm.secondaryColor} onChange={(event) => setTemplateForm((current) => ({ ...current, secondaryColor: event.target.value }))} />
              <input className={inputClassName} placeholder="Accent color" value={templateForm.accentColor} onChange={(event) => setTemplateForm((current) => ({ ...current, accentColor: event.target.value }))} />
              <input className={inputClassName} placeholder="Font family" value={templateForm.fontFamily} onChange={(event) => setTemplateForm((current) => ({ ...current, fontFamily: event.target.value }))} />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {featureKeys.map((key) => (
                <label key={key} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  <input type="checkbox" checked={Boolean(templateForm[key])} onChange={(event) => setTemplateForm((current) => ({ ...current, [key]: event.target.checked }))} />
                  {key}
                </label>
              ))}
            </div>
            <button type="submit" disabled={saving} className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60">
              {saving ? 'Saving...' : 'Save Template'}
            </button>
          </form>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Billing Plans</h2>
          <div className="mt-5 grid gap-4 xl:grid-cols-3">
            {plans.map((plan) => (
              <article key={plan._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-semibold text-slate-900">{plan.name}</p>
                <p className="mt-1 text-sm text-slate-500">{plan.description}</p>
                <p className="mt-3 text-sm text-slate-600">
                  ${plan.priceMonthly}/mo / ${plan.priceYearly}/yr
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  {plan.userLimit} users / {plan.branchLimit} branches
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Create / Update Billing Plan</h2>
          <form className="mt-5 space-y-4" onSubmit={saveBillingPlan}>
            <div className="grid gap-4 md:grid-cols-2">
              <input className={inputClassName} placeholder="Plan key" value={billingPlanForm.key} onChange={(event) => setBillingPlanForm((current) => ({ ...current, key: event.target.value }))} />
              <input className={inputClassName} placeholder="Plan name" value={billingPlanForm.name} onChange={(event) => setBillingPlanForm((current) => ({ ...current, name: event.target.value }))} />
              <input className={inputClassName} placeholder="Monthly price" type="number" value={billingPlanForm.priceMonthly} onChange={(event) => setBillingPlanForm((current) => ({ ...current, priceMonthly: event.target.value }))} />
              <input className={inputClassName} placeholder="Yearly price" type="number" value={billingPlanForm.priceYearly} onChange={(event) => setBillingPlanForm((current) => ({ ...current, priceYearly: event.target.value }))} />
              <input className={inputClassName} placeholder="User limit" type="number" value={billingPlanForm.userLimit} onChange={(event) => setBillingPlanForm((current) => ({ ...current, userLimit: event.target.value }))} />
              <input className={inputClassName} placeholder="Branch limit" type="number" value={billingPlanForm.branchLimit} onChange={(event) => setBillingPlanForm((current) => ({ ...current, branchLimit: event.target.value }))} />
            </div>
            <textarea className={inputClassName} rows={3} placeholder="Description" value={billingPlanForm.description} onChange={(event) => setBillingPlanForm((current) => ({ ...current, description: event.target.value }))} />
            <div className="grid gap-3 md:grid-cols-2">
              {featureKeys.map((key) => (
                <label key={key} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  <input type="checkbox" checked={Boolean(billingPlanForm[key])} onChange={(event) => setBillingPlanForm((current) => ({ ...current, [key]: event.target.checked }))} />
                  {key}
                </label>
              ))}
            </div>
            <button type="submit" disabled={saving} className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60">
              {saving ? 'Saving...' : 'Save Billing Plan'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

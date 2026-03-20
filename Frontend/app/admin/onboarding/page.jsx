'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { ErrorState, LoadingState, StatusPill } from '@/components/app/shared';
import { superAdminAPI } from '@/src/services/api';

const STEPS = [
  'Consultancy Info',
  'Plan Selection',
  'Admin User',
  'Template Selection',
  'Branding',
  'Branch Setup',
  'Activate',
];

const inputClassName =
  'w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:bg-white';

const createEmptyBranch = () => ({
  name: '',
  code: '',
  city: '',
  country: '',
  email: '',
  contactNumber: '',
  visibility: 'branch',
});

export default function SuperAdminOnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(0);
  const [templates, setTemplates] = useState([]);
  const [billingPlans, setBillingPlans] = useState([]);
  const [form, setForm] = useState({
    consultancy: {
      name: '',
      email: '',
      country: 'Nepal',
      timezone: 'Asia/Kathmandu',
      website: '',
      description: '',
      currency: 'USD',
    },
    plan: {
      key: 'starter',
      status: 'trial',
      billingCycle: 'monthly',
    },
    adminUser: {
      name: '',
      email: '',
      password: '',
      phone: '',
      countries: [],
    },
    templateKey: '',
    branding: {
      primaryColor: '#0f766e',
      secondaryColor: '#0f172a',
      accentColor: '#2dd4bf',
      fontFamily: 'DM Sans',
      logo: '',
      supportEmail: '',
    },
    branches: [createEmptyBranch()],
  });

  const selectedPlan = useMemo(
    () => billingPlans.find((plan) => plan.key === form.plan.key) || null,
    [billingPlans, form.plan.key]
  );

  const loadDependencies = async () => {
    setLoading(true);
    setError('');
    try {
      const [templatesResponse, plansResponse] = await Promise.all([
        superAdminAPI.getTemplates(),
        superAdminAPI.getBillingPlans(),
      ]);
      const nextTemplates = templatesResponse.data?.data?.templates || [];
      const nextPlans = plansResponse.data?.data?.plans || [];
      setTemplates(nextTemplates);
      setBillingPlans(nextPlans);
      setForm((current) => ({
        ...current,
        templateKey: current.templateKey || nextTemplates[0]?.key || '',
        plan: {
          ...current.plan,
          key: current.plan.key || nextPlans[0]?.key || 'starter',
        },
      }));
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to load onboarding dependencies.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDependencies();
  }, []);

  const updateSection = (section, field, value) => {
    setForm((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [field]: value,
      },
    }));
  };

  const updateBranch = (index, field, value) => {
    setForm((current) => ({
      ...current,
      branches: current.branches.map((branch, branchIndex) =>
        branchIndex === index ? { ...branch, [field]: value } : branch
      ),
    }));
  };

  const addBranch = () => {
    setForm((current) => ({
      ...current,
      branches: [...current.branches, createEmptyBranch()],
    }));
  };

  const removeBranch = (index) => {
    setForm((current) => ({
      ...current,
      branches: current.branches.filter((_, branchIndex) => branchIndex !== index),
    }));
  };

  const nextStep = () => setStep((current) => Math.min(current + 1, STEPS.length - 1));
  const prevStep = () => setStep((current) => Math.max(current - 1, 0));

  const submitTenant = async () => {
    if (!form.consultancy.name || !form.consultancy.email || !form.adminUser.name || !form.adminUser.email || !form.adminUser.password) {
      setError('Consultancy and admin details are required before activation.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const response = await superAdminAPI.createTenant(form);
      const tenantId = response.data?.data?.tenant?.id;
      router.push(tenantId ? `/admin/tenants/${tenantId}` : '/admin/tenants');
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to create tenant.'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingState label="Preparing onboarding wizard..." />;
  }

  return (
    <div className="space-y-8">
      {error ? <ErrorState message={error} onRetry={loadDependencies} /> : null}

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-teal-700">
          Onboarding Wizard
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          Create a new consultancy tenant
        </h1>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
          Set up the tenancy, assign the commercial plan, choose a reusable template, seed
          branches, and activate the admin workspace in one guided flow.
        </p>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 xl:grid-cols-7">
          {STEPS.map((label, index) => (
            <div key={label} className="rounded-2xl border border-slate-200 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Step {index + 1}
              </p>
              <p className="mt-2 font-semibold text-slate-900">{label}</p>
              <div className="mt-3">
                <StatusPill tone={index < step ? 'completed' : index === step ? 'due_today' : 'pending'}>
                  {index < step ? 'Done' : index === step ? 'Current' : 'Pending'}
                </StatusPill>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        {step === 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            <input className={inputClassName} placeholder="Consultancy name" value={form.consultancy.name} onChange={(event) => updateSection('consultancy', 'name', event.target.value)} />
            <input className={inputClassName} placeholder="Consultancy email" value={form.consultancy.email} onChange={(event) => updateSection('consultancy', 'email', event.target.value)} />
            <input className={inputClassName} placeholder="Country" value={form.consultancy.country} onChange={(event) => updateSection('consultancy', 'country', event.target.value)} />
            <input className={inputClassName} placeholder="Timezone" value={form.consultancy.timezone} onChange={(event) => updateSection('consultancy', 'timezone', event.target.value)} />
            <input className={inputClassName} placeholder="Website" value={form.consultancy.website} onChange={(event) => updateSection('consultancy', 'website', event.target.value)} />
            <input className={inputClassName} placeholder="Currency" value={form.consultancy.currency} onChange={(event) => updateSection('consultancy', 'currency', event.target.value)} />
            <textarea className={`${inputClassName} md:col-span-2`} rows={4} placeholder="Consultancy description" value={form.consultancy.description} onChange={(event) => updateSection('consultancy', 'description', event.target.value)} />
          </div>
        ) : null}

        {step === 1 ? (
          <div className="grid gap-4 md:grid-cols-2">
            <select className={inputClassName} value={form.plan.key} onChange={(event) => updateSection('plan', 'key', event.target.value)}>
              {billingPlans.map((plan) => (
                <option key={plan.key} value={plan.key}>{plan.name}</option>
              ))}
            </select>
            <select className={inputClassName} value={form.plan.status} onChange={(event) => updateSection('plan', 'status', event.target.value)}>
              <option value="trial">Trial</option>
              <option value="active">Active</option>
            </select>
            <select className={inputClassName} value={form.plan.billingCycle} onChange={(event) => updateSection('plan', 'billingCycle', event.target.value)}>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <p className="font-semibold text-slate-900">{selectedPlan?.name || 'Plan'}</p>
              <p className="mt-2">Users: {selectedPlan?.userLimit || 0}</p>
              <p>Branches: {selectedPlan?.branchLimit || 0}</p>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="grid gap-4 md:grid-cols-2">
            <input className={inputClassName} placeholder="Admin full name" value={form.adminUser.name} onChange={(event) => updateSection('adminUser', 'name', event.target.value)} />
            <input className={inputClassName} placeholder="Admin email" value={form.adminUser.email} onChange={(event) => updateSection('adminUser', 'email', event.target.value)} />
            <input className={inputClassName} placeholder="Admin password" type="password" value={form.adminUser.password} onChange={(event) => updateSection('adminUser', 'password', event.target.value)} />
            <input className={inputClassName} placeholder="Admin phone" value={form.adminUser.phone} onChange={(event) => updateSection('adminUser', 'phone', event.target.value)} />
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4">
            <select className={inputClassName} value={form.templateKey} onChange={(event) => setForm((current) => ({ ...current, templateKey: event.target.value }))}>
              {templates.map((template) => (
                <option key={template.key} value={template.key}>{template.name}</option>
              ))}
            </select>
            <div className="grid gap-4 md:grid-cols-2">
              {templates.map((template) => (
                <button
                  key={template.key}
                  type="button"
                  onClick={() => setForm((current) => ({ ...current, templateKey: template.key }))}
                  className={`rounded-2xl border p-4 text-left transition ${
                    form.templateKey === template.key
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-slate-50 text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <p className="font-semibold">{template.name}</p>
                  <p className="mt-2 text-sm opacity-80">{template.description}</p>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="grid gap-4 md:grid-cols-2">
            <input className={inputClassName} placeholder="Primary color" value={form.branding.primaryColor} onChange={(event) => updateSection('branding', 'primaryColor', event.target.value)} />
            <input className={inputClassName} placeholder="Secondary color" value={form.branding.secondaryColor} onChange={(event) => updateSection('branding', 'secondaryColor', event.target.value)} />
            <input className={inputClassName} placeholder="Accent color" value={form.branding.accentColor} onChange={(event) => updateSection('branding', 'accentColor', event.target.value)} />
            <input className={inputClassName} placeholder="Font family" value={form.branding.fontFamily} onChange={(event) => updateSection('branding', 'fontFamily', event.target.value)} />
            <input className={inputClassName} placeholder="Logo URL" value={form.branding.logo} onChange={(event) => updateSection('branding', 'logo', event.target.value)} />
            <input className={inputClassName} placeholder="Support email" value={form.branding.supportEmail} onChange={(event) => updateSection('branding', 'supportEmail', event.target.value)} />
          </div>
        ) : null}

        {step === 5 ? (
          <div className="space-y-4">
            {form.branches.map((branch, index) => (
              <div key={`${branch.name || 'branch'}-${index}`} className="grid gap-4 rounded-2xl border border-slate-200 p-4 md:grid-cols-3">
                <input className={inputClassName} placeholder="Branch name" value={branch.name} onChange={(event) => updateBranch(index, 'name', event.target.value)} />
                <input className={inputClassName} placeholder="Code" value={branch.code} onChange={(event) => updateBranch(index, 'code', event.target.value)} />
                <input className={inputClassName} placeholder="City" value={branch.city} onChange={(event) => updateBranch(index, 'city', event.target.value)} />
                <input className={inputClassName} placeholder="Country" value={branch.country} onChange={(event) => updateBranch(index, 'country', event.target.value)} />
                <input className={inputClassName} placeholder="Email" value={branch.email} onChange={(event) => updateBranch(index, 'email', event.target.value)} />
                <input className={inputClassName} placeholder="Contact number" value={branch.contactNumber} onChange={(event) => updateBranch(index, 'contactNumber', event.target.value)} />
                <div className="md:col-span-3 flex gap-3">
                  <button type="button" onClick={() => removeBranch(index)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                    Remove
                  </button>
                </div>
              </div>
            ))}
            <button type="button" onClick={addBranch} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
              Add Branch
            </button>
          </div>
        ) : null}

        {step === 6 ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="font-semibold text-slate-900">{form.consultancy.name || 'Consultancy name pending'}</p>
              <p className="mt-2 text-sm text-slate-600">{form.consultancy.email}</p>
              <p className="mt-2 text-sm text-slate-600">Plan: {form.plan.key}</p>
              <p className="mt-2 text-sm text-slate-600">Template: {form.templateKey || 'None selected'}</p>
              <p className="mt-2 text-sm text-slate-600">Branches to seed: {form.branches.filter((branch) => branch.name).length}</p>
            </div>
            <button type="button" onClick={submitTenant} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60">
              <Sparkles className="h-4 w-4" />
              {saving ? 'Activating...' : 'Activate Tenant'}
            </button>
          </div>
        ) : null}
      </section>

      <div className="flex items-center justify-between">
        <button type="button" onClick={prevStep} disabled={step === 0} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50">
          <ArrowLeft className="h-4 w-4" />
          Previous
        </button>
        <button type="button" onClick={nextStep} disabled={step === STEPS.length - 1} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50">
          Next
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

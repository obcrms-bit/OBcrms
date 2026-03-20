'use client';

import { useEffect, useMemo, useState } from 'react';
import { Building2, CreditCard, Globe2, ShieldCheck, Users, Workflow } from 'lucide-react';
import AppShell from '@/components/app/app-shell';
import {
  ErrorState,
  LoadingState,
  MetricCard,
  StatusPill,
} from '@/components/app/shared';
import { useAuth } from '@/context/AuthContext';
import { organizationAPI } from '@/src/services/api';
import { hasPermission } from '@/src/services/access';

const inputClassName =
  'w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:bg-white';

const emptyWorkflowForm = {
  country: '',
  leadStages: 'enquiry, counselling, docs, lodge, visa',
  applicationStages: 'draft, submitted, offer, visa, completed',
  documentChecklist: 'Passport, Academic Transcript, English Test Score',
  initialHours: 8,
  recurringHours: 48,
  overdueReminderHours: 24,
  cadenceLabel: '',
  firstResponseHours: 4,
  firstFollowUpHours: 8,
  offerDecisionHours: 72,
};

const emptySubscriptionForm = {
  plan: '',
  status: '',
  billingCycle: 'monthly',
  userLimit: 0,
  branchLimit: 0,
  bulkImports: false,
  advancedWorkflows: false,
  notifications: true,
  reports: true,
  transfers: true,
  commissions: true,
  customBranding: false,
  automations: false,
  publicForms: true,
  websiteIntegration: true,
  qrForms: false,
  billing: true,
};

export default function OrganizationPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState(null);
  const [slaForm, setSlaForm] = useState({
    firstResponseHours: 4,
    firstFollowUpHours: 8,
    maxHoursBetweenFollowUps: 48,
    overdueReminderHours: 24,
    transferApprovalHours: 24,
    transferApprovalRequired: false,
  });
  const [workflowForm, setWorkflowForm] = useState(emptyWorkflowForm);
  const [subscriptionForm, setSubscriptionForm] = useState(emptySubscriptionForm);
  const [savingWorkflow, setSavingWorkflow] = useState(false);
  const [savingSubscription, setSavingSubscription] = useState(false);
  const canEditSettings =
    hasPermission(user, 'settings', 'edit') || hasPermission(user, 'settings', 'manage');
  const canManageSettings = hasPermission(user, 'settings', 'manage');

  const loadSummary = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await organizationAPI.getSummary();
      const data = response.data?.data;
      setSummary(data);
      if (data?.slaConfig) {
        setSlaForm({
          firstResponseHours: data.slaConfig.firstResponseHours || 4,
          firstFollowUpHours: data.slaConfig.firstFollowUpHours || 8,
          maxHoursBetweenFollowUps: data.slaConfig.maxHoursBetweenFollowUps || 48,
          overdueReminderHours: data.slaConfig.overdueReminderHours || 24,
          transferApprovalHours: data.slaConfig.transferApprovalHours || 24,
          transferApprovalRequired: Boolean(data.slaConfig.transferApprovalRequired),
        });
      }
      if (data?.subscription) {
        setSubscriptionForm({
          plan: data.subscription.plan || '',
          status: data.subscription.status || '',
          billingCycle: data.subscription.billingCycle || 'monthly',
          userLimit: data.subscription.userLimit || 0,
          branchLimit: data.subscription.branchLimit || 0,
          bulkImports: Boolean(data.subscription.featureAccess?.bulkImports),
          advancedWorkflows: Boolean(data.subscription.featureAccess?.advancedWorkflows),
          notifications: Boolean(data.subscription.featureAccess?.notifications),
          reports: Boolean(data.subscription.featureAccess?.reports),
          transfers: Boolean(data.subscription.featureAccess?.transfers),
          commissions: Boolean(data.subscription.featureAccess?.commissions),
          customBranding: Boolean(data.subscription.featureAccess?.customBranding),
          automations: Boolean(data.subscription.featureAccess?.automations),
          publicForms: Boolean(data.subscription.featureAccess?.publicForms),
          websiteIntegration: Boolean(data.subscription.featureAccess?.websiteIntegration),
          qrForms: Boolean(data.subscription.featureAccess?.qrForms),
          billing: Boolean(data.subscription.featureAccess?.billing),
        });
      }
      if (data?.countryWorkflows?.length) {
        const firstWorkflow = data.countryWorkflows[0];
        setWorkflowForm({
          country: firstWorkflow.country || '',
          leadStages: (firstWorkflow.leadStages || []).map((stage) => stage.label).join(', '),
          applicationStages: (firstWorkflow.applicationStages || [])
            .map((stage) => stage.label)
            .join(', '),
          documentChecklist: (firstWorkflow.documentChecklist || [])
            .map((item) => item.name)
            .join(', '),
          initialHours: firstWorkflow.followUpRules?.initialHours || 8,
          recurringHours: firstWorkflow.followUpRules?.recurringHours || 48,
          overdueReminderHours: firstWorkflow.followUpRules?.overdueReminderHours || 24,
          cadenceLabel: firstWorkflow.followUpRules?.cadenceLabel || '',
          firstResponseHours: firstWorkflow.slaRules?.firstResponseHours || 4,
          firstFollowUpHours: firstWorkflow.slaRules?.firstFollowUpHours || 8,
          offerDecisionHours: firstWorkflow.slaRules?.offerDecisionHours || 72,
        });
      }
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to load organization workspace.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  const cards = useMemo(
    () => [
      {
        label: 'Branches',
        value: summary?.counts?.branches || 0,
        helper: 'Consultancy branch network',
        icon: Building2,
        accent: 'bg-slate-900',
      },
      {
        label: 'Users',
        value: summary?.counts?.users || 0,
        helper: `${summary?.counts?.activeUsers || 0} active staff`,
        icon: Users,
        accent: 'bg-sky-600',
      },
      {
        label: 'Roles',
        value: summary?.counts?.roles || 0,
        helper: 'Seeded and custom roles',
        icon: ShieldCheck,
        accent: 'bg-emerald-600',
      },
      {
        label: 'Permission Bundles',
        value: summary?.counts?.permissionBundles || 0,
        helper: 'Extra access overlays',
        icon: Workflow,
        accent: 'bg-amber-600',
      },
      {
        label: 'Country Workflows',
        value: summary?.counts?.countryWorkflows || 0,
        helper: summary?.subscription?.plan
          ? `${summary.subscription.plan} workflow engine`
          : 'Tenant workflow variants',
        icon: Globe2,
        accent: 'bg-teal-600',
      },
    ],
    [summary]
  );

  const handleSaveSla = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await organizationAPI.updateSlaConfig(slaForm);
      await loadSummary();
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to save SLA configuration.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSaveWorkflow = async (event) => {
    event.preventDefault();
    setSavingWorkflow(true);
    setError('');
    try {
      await organizationAPI.saveCountryWorkflow({
        country: workflowForm.country,
        leadStages: workflowForm.leadStages
          .split(',')
          .map((item, index) => ({
            key: item.trim().toLowerCase().replace(/\s+/g, '_'),
            label: item.trim(),
            order: index + 1,
          }))
          .filter((item) => item.label),
        applicationStages: workflowForm.applicationStages
          .split(',')
          .map((item, index) => ({
            key: item.trim().toLowerCase().replace(/\s+/g, '_'),
            label: item.trim(),
            order: index + 1,
          }))
          .filter((item) => item.label),
        documentChecklist: workflowForm.documentChecklist
          .split(',')
          .map((item) => ({
            name: item.trim(),
            required: true,
          }))
          .filter((item) => item.name),
        followUpRules: {
          initialHours: Number(workflowForm.initialHours || 0),
          recurringHours: Number(workflowForm.recurringHours || 0),
          overdueReminderHours: Number(workflowForm.overdueReminderHours || 0),
          cadenceLabel: workflowForm.cadenceLabel,
        },
        slaRules: {
          firstResponseHours: Number(workflowForm.firstResponseHours || 0),
          firstFollowUpHours: Number(workflowForm.firstFollowUpHours || 0),
          offerDecisionHours: Number(workflowForm.offerDecisionHours || 0),
        },
      });
      await loadSummary();
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to save country workflow.'
      );
    } finally {
      setSavingWorkflow(false);
    }
  };

  const handleSaveSubscription = async (event) => {
    event.preventDefault();
    setSavingSubscription(true);
    setError('');
    try {
      await organizationAPI.updateSubscription({
        plan: subscriptionForm.plan,
        status: subscriptionForm.status,
        billingCycle: subscriptionForm.billingCycle,
        userLimit: Number(subscriptionForm.userLimit || 0),
        branchLimit: Number(subscriptionForm.branchLimit || 0),
        featureAccess: {
          bulkImports: subscriptionForm.bulkImports,
          advancedWorkflows: subscriptionForm.advancedWorkflows,
          notifications: subscriptionForm.notifications,
          reports: subscriptionForm.reports,
          transfers: subscriptionForm.transfers,
          commissions: subscriptionForm.commissions,
          customBranding: subscriptionForm.customBranding,
          automations: subscriptionForm.automations,
          publicForms: subscriptionForm.publicForms,
          websiteIntegration: subscriptionForm.websiteIntegration,
          qrForms: subscriptionForm.qrForms,
          billing: subscriptionForm.billing,
        },
      });
      await loadSummary();
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to save subscription settings.'
      );
    } finally {
      setSavingSubscription(false);
    }
  };

  return (
    <AppShell
      title="Organization"
      description="Tenant setup, branch hierarchy, RBAC structure, SLA policies, and the recent audit trail for enterprise operations."
    >
      {loading ? <LoadingState label="Loading organization workspace..." /> : null}

      {!loading ? (
        <div className="space-y-8">
          {error ? <ErrorState message={error} onRetry={loadSummary} /> : null}

          <div className="grid gap-4 xl:grid-cols-5">
            {cards.map((card) => (
              <MetricCard
                key={card.label}
                label={card.label}
                value={card.value}
                helper={card.helper}
                icon={card.icon}
                accent={card.accent}
              />
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Branch Visibility
              </p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">
                Consultancy branch structure
              </h3>
              <div className="mt-6 overflow-x-auto">
                <table className="w-full min-w-[620px] text-left">
                  <thead className="border-b border-slate-200 text-xs uppercase tracking-[0.2em] text-slate-500">
                    <tr>
                      <th className="pb-3">Branch</th>
                      <th className="pb-3">Code</th>
                      <th className="pb-3">Location</th>
                      <th className="pb-3">Visibility</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(summary?.branches || []).map((branch) => (
                      <tr key={branch._id}>
                        <td className="py-4 font-semibold text-slate-900">{branch.name}</td>
                        <td className="py-4 text-sm text-slate-600">{branch.code || '-'}</td>
                        <td className="py-4 text-sm text-slate-600">
                          {[branch.city, branch.country].filter(Boolean).join(', ') ||
                            branch.location ||
                            '-'}
                        </td>
                        <td className="py-4">
                          <StatusPill tone={branch.isHeadOffice ? 'converted' : 'pending'}>
                            {branch.isHeadOffice ? 'Head Office' : branch.visibility || 'branch'}
                          </StatusPill>
                        </td>
                        <td className="py-4">
                          <StatusPill tone={branch.isActive ? 'completed' : 'lost'}>
                            {branch.isActive ? 'Active' : 'Inactive'}
                          </StatusPill>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                SLA Policy
              </p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">
                Service-level guardrails
              </h3>
              <form className="mt-6 space-y-4" onSubmit={handleSaveSla}>
                {[
                  ['firstResponseHours', 'First response hours'],
                  ['firstFollowUpHours', 'First follow-up hours'],
                  ['maxHoursBetweenFollowUps', 'Max hours between follow-ups'],
                  ['overdueReminderHours', 'Overdue reminder hours'],
                  ['transferApprovalHours', 'Transfer approval hours'],
                ].map(([field, label]) => (
                  <label key={field} className="block space-y-2">
                    <span className="text-sm font-semibold text-slate-700">{label}</span>
                    <input
                      type="number"
                      min="1"
                      className={inputClassName}
                      value={slaForm[field]}
                      onChange={(event) =>
                        setSlaForm((current) => ({
                          ...current,
                          [field]: Number(event.target.value || 0),
                        }))
                      }
                    />
                  </label>
                ))}
                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={slaForm.transferApprovalRequired}
                    onChange={(event) =>
                      setSlaForm((current) => ({
                        ...current,
                        transferApprovalRequired: event.target.checked,
                      }))
                    }
                  />
                  Require approval before inter-branch transfer completes
                </label>
                <button
                  type="submit"
                  disabled={saving || !canEditSettings}
                  className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Save SLA Settings'}
                </button>
              </form>
            </section>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Country Workflows
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-slate-900">
                    Country-specific counselling operations
                  </h3>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
                  <Globe2 className="h-4 w-4" />
                  Dynamic country rules
                </div>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
                <div className="space-y-3">
                  {(summary?.countryWorkflows || []).map((workflow) => (
                    <button
                      key={workflow._id}
                      type="button"
                      onClick={() =>
                        setWorkflowForm({
                          country: workflow.country || '',
                          leadStages: (workflow.leadStages || [])
                            .map((stage) => stage.label)
                            .join(', '),
                          applicationStages: (workflow.applicationStages || [])
                            .map((stage) => stage.label)
                            .join(', '),
                          documentChecklist: (workflow.documentChecklist || [])
                            .map((item) => item.name)
                            .join(', '),
                          initialHours: workflow.followUpRules?.initialHours || 8,
                          recurringHours: workflow.followUpRules?.recurringHours || 48,
                          overdueReminderHours:
                            workflow.followUpRules?.overdueReminderHours || 24,
                          cadenceLabel: workflow.followUpRules?.cadenceLabel || '',
                          firstResponseHours: workflow.slaRules?.firstResponseHours || 4,
                          firstFollowUpHours: workflow.slaRules?.firstFollowUpHours || 8,
                          offerDecisionHours: workflow.slaRules?.offerDecisionHours || 72,
                        })
                      }
                      className="w-full rounded-2xl border border-slate-200 p-4 text-left transition hover:border-teal-300 hover:bg-teal-50/60"
                    >
                      <p className="font-semibold text-slate-900">{workflow.country}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {(workflow.leadStages || []).map((stage) => stage.label).join(' -> ')}
                      </p>
                    </button>
                  ))}
                </div>

                <form className="space-y-4" onSubmit={handleSaveWorkflow}>
                  <label className="block space-y-2">
                    <span className="text-sm font-semibold text-slate-700">Country</span>
                    <input
                      className={inputClassName}
                      value={workflowForm.country}
                      onChange={(event) =>
                        setWorkflowForm((current) => ({
                          ...current,
                          country: event.target.value,
                        }))
                      }
                    />
                  </label>
                  {[
                    ['leadStages', 'Lead stages (comma separated)'],
                    ['applicationStages', 'Application stages (comma separated)'],
                    ['documentChecklist', 'Document checklist (comma separated)'],
                  ].map(([field, label]) => (
                    <label key={field} className="block space-y-2">
                      <span className="text-sm font-semibold text-slate-700">{label}</span>
                      <textarea
                        rows={3}
                        className={inputClassName}
                        value={workflowForm[field]}
                        onChange={(event) =>
                          setWorkflowForm((current) => ({
                            ...current,
                            [field]: event.target.value,
                          }))
                        }
                      />
                    </label>
                  ))}
                  <div className="grid gap-4 md:grid-cols-2">
                    {[
                      ['initialHours', 'Initial follow-up hours'],
                      ['recurringHours', 'Recurring follow-up hours'],
                      ['overdueReminderHours', 'Overdue reminder hours'],
                      ['firstResponseHours', 'First response SLA'],
                      ['firstFollowUpHours', 'First follow-up SLA'],
                      ['offerDecisionHours', 'Offer decision SLA'],
                    ].map(([field, label]) => (
                      <label key={field} className="block space-y-2">
                        <span className="text-sm font-semibold text-slate-700">{label}</span>
                        <input
                          type="number"
                          min="1"
                          className={inputClassName}
                          value={workflowForm[field]}
                          onChange={(event) =>
                            setWorkflowForm((current) => ({
                              ...current,
                              [field]: Number(event.target.value || 0),
                            }))
                          }
                        />
                      </label>
                    ))}
                  </div>
                  <label className="block space-y-2">
                    <span className="text-sm font-semibold text-slate-700">Cadence label</span>
                    <input
                      className={inputClassName}
                      value={workflowForm.cadenceLabel}
                      onChange={(event) =>
                        setWorkflowForm((current) => ({
                          ...current,
                          cadenceLabel: event.target.value,
                        }))
                      }
                    />
                  </label>
                <button
                  type="submit"
                  disabled={savingWorkflow || !canEditSettings}
                  className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                >
                  {savingWorkflow ? 'Saving...' : 'Save Workflow'}
                </button>
                </form>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Billing & Plan
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-slate-900">
                    Subscription limits and feature access
                  </h3>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  <CreditCard className="h-4 w-4" />
                  Stripe-ready foundation
                </div>
              </div>

              <form className="mt-6 space-y-4" onSubmit={handleSaveSubscription}>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block space-y-2">
                    <span className="text-sm font-semibold text-slate-700">Plan</span>
                    <select
                      className={inputClassName}
                      value={subscriptionForm.plan}
                      onChange={(event) =>
                        setSubscriptionForm((current) => ({
                          ...current,
                          plan: event.target.value,
                        }))
                      }
                    >
                      <option value="">Select plan</option>
                      <option value="starter">Starter</option>
                      <option value="growth">Growth</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </label>
                  <label className="block space-y-2">
                    <span className="text-sm font-semibold text-slate-700">Status</span>
                    <select
                      className={inputClassName}
                      value={subscriptionForm.status}
                      onChange={(event) =>
                        setSubscriptionForm((current) => ({
                          ...current,
                          status: event.target.value,
                        }))
                      }
                    >
                      <option value="">Select status</option>
                      <option value="trial">Trial</option>
                      <option value="active">Active</option>
                      <option value="past_due">Past Due</option>
                      <option value="inactive">Inactive</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </label>
                  <label className="block space-y-2">
                    <span className="text-sm font-semibold text-slate-700">User limit</span>
                    <input
                      type="number"
                      min="1"
                      className={inputClassName}
                      value={subscriptionForm.userLimit}
                      onChange={(event) =>
                        setSubscriptionForm((current) => ({
                          ...current,
                          userLimit: Number(event.target.value || 0),
                        }))
                      }
                    />
                  </label>
                  <label className="block space-y-2">
                    <span className="text-sm font-semibold text-slate-700">Branch limit</span>
                    <input
                      type="number"
                      min="1"
                      className={inputClassName}
                      value={subscriptionForm.branchLimit}
                      onChange={(event) =>
                        setSubscriptionForm((current) => ({
                          ...current,
                          branchLimit: Number(event.target.value || 0),
                        }))
                      }
                    />
                  </label>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {[
                    ['bulkImports', 'Bulk imports'],
                    ['advancedWorkflows', 'Advanced workflows'],
                    ['notifications', 'Notifications'],
                    ['reports', 'Reports'],
                    ['transfers', 'Transfers'],
                    ['commissions', 'Commissions'],
                    ['customBranding', 'Custom branding'],
                    ['automations', 'Automations'],
                    ['publicForms', 'Public forms'],
                    ['websiteIntegration', 'Website integration'],
                    ['qrForms', 'QR forms'],
                    ['billing', 'Billing'],
                  ].map(([field, label]) => (
                    <label
                      key={field}
                      className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                    >
                      <input
                        type="checkbox"
                        checked={subscriptionForm[field]}
                        onChange={(event) =>
                          setSubscriptionForm((current) => ({
                            ...current,
                            [field]: event.target.checked,
                          }))
                        }
                      />
                      {label}
                    </label>
                  ))}
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                  Current usage: {summary?.subscription?.usage?.activeUsers || 0}/
                  {summary?.subscription?.userLimit || subscriptionForm.userLimit} users,{' '}
                  {summary?.subscription?.usage?.branches || 0}/
                  {summary?.subscription?.branchLimit || subscriptionForm.branchLimit} branches
                </div>

                <button
                  type="submit"
                  disabled={
                    savingSubscription ||
                    !canManageSettings ||
                    !subscriptionForm.plan ||
                    !subscriptionForm.status
                  }
                  className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                >
                  {savingSubscription ? 'Saving...' : 'Save Subscription'}
                </button>
              </form>
            </section>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Role Matrix
              </p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">
                Default and custom roles
              </h3>
              <div className="mt-6 space-y-3">
                {(summary?.roles || []).map((role) => (
                  <div key={role._id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{role.name}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          {role.description || 'Role description not set'}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {role.isSystem ? <StatusPill tone="completed">System</StatusPill> : null}
                        {role.isHeadOffice ? <StatusPill tone="converted">Head Office</StatusPill> : null}
                        {role.managerEnabled ? <StatusPill tone="due_today">Manager</StatusPill> : null}
                      </div>
                    </div>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
                      {role.permissions?.length || 0} permission groups
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                User Access
              </p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">
                Tenant staff roster
              </h3>
              <div className="mt-6 overflow-x-auto">
                <table className="w-full min-w-[620px] text-left">
                  <thead className="border-b border-slate-200 text-xs uppercase tracking-[0.2em] text-slate-500">
                    <tr>
                      <th className="pb-3">User</th>
                      <th className="pb-3">Role</th>
                      <th className="pb-3">Branch</th>
                      <th className="pb-3">Access</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(summary?.users || []).map((user) => (
                      <tr key={user._id}>
                        <td className="py-4">
                          <p className="font-semibold text-slate-900">{user.name}</p>
                          <p className="text-sm text-slate-500">{user.email}</p>
                        </td>
                        <td className="py-4 text-sm text-slate-600">
                          {user.primaryRoleKey || user.role}
                        </td>
                        <td className="py-4 text-sm text-slate-600">
                          {user.branchId?.name || (user.isHeadOffice ? 'Head Office' : 'Unassigned')}
                        </td>
                        <td className="py-4">
                          <div className="flex flex-wrap gap-2">
                            <StatusPill tone={user.isActive ? 'completed' : 'lost'}>
                              {user.isActive ? 'Active' : 'Inactive'}
                            </StatusPill>
                            {user.isHeadOffice ? <StatusPill tone="converted">Head Office</StatusPill> : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Audit Trail
            </p>
            <h3 className="mt-2 text-xl font-semibold text-slate-900">
              Recent sensitive activity
            </h3>
            <div className="mt-6 space-y-3">
              {(summary?.recentAuditLogs || []).map((log) => (
                <div key={log._id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {log.action} on {log.resource}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {log.userName || 'System'} / {new Date(log.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {log.module ? <StatusPill tone="pending">{log.module}</StatusPill> : null}
                      <StatusPill tone={log.status === 'failure' ? 'lost' : 'completed'}>
                        {log.status || 'success'}
                      </StatusPill>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </AppShell>
  );
}

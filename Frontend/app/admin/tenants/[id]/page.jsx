'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle, BadgeCheck, CreditCard, Globe2, Sparkles, Users } from 'lucide-react';
import {
  ErrorState,
  LoadingState,
  MetricCard,
  StatusPill,
  formatCurrency,
  formatDate,
  formatDateTime,
} from '@/components/app/shared';
import { useAuth } from '@/context/AuthContext';
import { superAdminAPI } from '@/src/services/api';
import { useTenantStore } from '@/src/stores/AppDataStore';

const TABS = [
  ['overview', 'Overview'],
  ['branches', 'Branches'],
  ['users', 'Users'],
  ['subscription', 'Subscription'],
  ['workflow', 'Workflow & Template'],
  ['forms', 'Forms & QR'],
  ['website', 'Website'],
  ['billing', 'Billing'],
  ['audit', 'Audit Logs'],
];

const inputClassName =
  'w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:bg-white';

export default function SuperAdminTenantDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState('');
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  const [selectedTemplateKey, setSelectedTemplateKey] = useState('');
  const [subscriptionForm, setSubscriptionForm] = useState({
    plan: '',
    status: '',
    billingCycle: 'monthly',
    userLimit: 0,
    branchLimit: 0,
  });
  const {
    tenantDetail: detail,
    loadingTenantDetail,
    error: storeError,
    loadTenantDetail,
  } = useTenantStore();

  const loadDetail = useCallback(async () => {
    setActionError('');
    try {
      const payload = await loadTenantDetail(id);
      setSubscriptionForm({
        plan: payload?.subscription?.plan || '',
        status: payload?.subscription?.status || '',
        billingCycle: payload?.subscription?.billingCycle || 'monthly',
        userLimit: payload?.subscription?.userLimit || 0,
        branchLimit: payload?.subscription?.branchLimit || 0,
      });
      setSelectedTemplateKey(payload?.templates?.[0]?.key || '');
    } catch (requestError) {
      return;
    }
  }, [id, loadTenantDetail]);

  useEffect(() => {
    loadDetail().catch(() => {});
  }, [loadDetail]);

  const error = actionError || storeError;

  const metrics = useMemo(
    () => [
      {
        label: 'Active Users',
        value: detail?.subscription?.usage?.activeUsers || 0,
        helper: `${detail?.subscription?.userLimit || 0} allowed by plan`,
        icon: Users,
        accent: 'bg-slate-900',
      },
      {
        label: 'Branches',
        value: detail?.subscription?.usage?.branches || 0,
        helper: `${detail?.subscription?.branchLimit || 0} allowed by plan`,
        icon: Globe2,
        accent: 'bg-sky-600',
      },
      {
        label: 'Workflows',
        value: detail?.workflows?.length || 0,
        helper: 'Country-aware operation rules',
        icon: Sparkles,
        accent: 'bg-teal-600',
      },
      {
        label: 'Health',
        value: `${detail?.health?.score || 0}/100`,
        helper: detail?.health?.warnings?.length
          ? `${detail.health.warnings.length} warnings`
          : 'Healthy setup',
        icon: BadgeCheck,
        accent: 'bg-emerald-600',
      },
    ],
    [detail]
  );

  const handleImpersonate = async () => {
    setSaving(true);
    setActionError('');
    try {
      const response = await superAdminAPI.impersonateTenant(id);
      await login(response.data?.data);
      router.push('/dashboard');
    } catch (requestError) {
      setActionError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to impersonate tenant.'
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async () => {
    setSaving(true);
    setActionError('');
    try {
      const nextStatus = detail?.tenant?.status === 'suspended' ? 'active' : 'suspended';
      await superAdminAPI.updateTenantStatus(id, { status: nextStatus });
      await loadDetail();
    } catch (requestError) {
      setActionError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to update tenant status.'
      );
    } finally {
      setSaving(false);
    }
  };

  const saveSubscription = async (event) => {
    event.preventDefault();
    setSaving(true);
    setActionError('');
    try {
      await superAdminAPI.updateTenantSubscription(id, {
        ...subscriptionForm,
        userLimit: Number(subscriptionForm.userLimit || 0),
        branchLimit: Number(subscriptionForm.branchLimit || 0),
      });
      await loadDetail();
    } catch (requestError) {
      setActionError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to save subscription.'
      );
    } finally {
      setSaving(false);
    }
  };

  const applyTemplate = async () => {
    if (!selectedTemplateKey) return;
    setSaving(true);
    setActionError('');
    try {
      await superAdminAPI.applyTemplate(id, selectedTemplateKey);
      await loadDetail();
    } catch (requestError) {
      setActionError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to apply template.'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loadingTenantDetail) {
    return <LoadingState label="Loading tenant workspace..." />;
  }

  return (
    <div className="space-y-8">
      {error ? <ErrorState message={error} onRetry={loadDetail} /> : null}

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Tenant Detail
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              {detail?.tenant?.name}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              {detail?.tenant?.description || 'Commercial tenant workspace and configuration health.'}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <StatusPill
                tone={
                  detail?.tenant?.status === 'active'
                    ? 'completed'
                    : detail?.tenant?.status === 'trial'
                      ? 'due_today'
                      : 'overdue'
                }
              >
                {detail?.tenant?.status || 'unknown'}
              </StatusPill>
              <StatusPill tone="pending">{detail?.subscription?.plan || 'Plan not set'}</StatusPill>
              <StatusPill tone="converted">{detail?.subscription?.status || 'Status not set'}</StatusPill>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleImpersonate}
              disabled={saving}
              className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              Impersonate
            </button>
            <button
              type="button"
              onClick={toggleStatus}
              disabled={saving}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
            >
              {detail?.tenant?.status === 'suspended' ? 'Activate' : 'Suspend'}
            </button>
            <Link
              href="/admin/tenants"
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Back
            </Link>
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <section className="space-y-6">
          <div className="flex flex-wrap gap-2 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            {TABS.map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${
                  activeTab === key
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            {activeTab === 'overview' ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Company Email</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{detail?.tenant?.email}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Created</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{formatDateTime(detail?.tenant?.createdAt)}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Timezone</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{detail?.tenant?.timezone || 'Not set'}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Applied Templates</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(detail?.tenant?.metadata?.appliedTemplates || []).map((templateKey) => (
                      <StatusPill key={templateKey} tone="converted">{templateKey}</StatusPill>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            {activeTab === 'branches' ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-left">
                  <thead className="border-b border-slate-200 text-xs uppercase tracking-[0.2em] text-slate-500">
                    <tr>
                      <th className="pb-3">Branch</th>
                      <th className="pb-3">Code</th>
                      <th className="pb-3">Location</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(detail?.branches || []).map((branch) => (
                      <tr key={branch._id}>
                        <td className="py-4 font-semibold text-slate-900">{branch.name}</td>
                        <td className="py-4 text-sm text-slate-600">{branch.code || '-'}</td>
                        <td className="py-4 text-sm text-slate-600">{[branch.city, branch.country].filter(Boolean).join(', ') || branch.location || '-'}</td>
                        <td className="py-4"><StatusPill tone={branch.isActive ? 'completed' : 'overdue'}>{branch.isActive ? 'Active' : 'Inactive'}</StatusPill></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}

            {activeTab === 'users' ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[840px] text-left">
                  <thead className="border-b border-slate-200 text-xs uppercase tracking-[0.2em] text-slate-500">
                    <tr>
                      <th className="pb-3">User</th>
                      <th className="pb-3">Role</th>
                      <th className="pb-3">Branch</th>
                      <th className="pb-3">Countries</th>
                      <th className="pb-3">Last Login</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(detail?.users || []).map((user) => (
                      <tr key={user._id}>
                        <td className="py-4">
                          <p className="font-semibold text-slate-900">{user.name}</p>
                          <p className="text-sm text-slate-500">{user.email}</p>
                        </td>
                        <td className="py-4 text-sm text-slate-600">{user.primaryRoleKey || user.role}</td>
                        <td className="py-4 text-sm text-slate-600">{user.branchId?.name || (user.isHeadOffice ? 'Head Office' : 'Unassigned')}</td>
                        <td className="py-4 text-sm text-slate-600">{(user.countries || []).join(', ') || '-'}</td>
                        <td className="py-4 text-sm text-slate-600">{user.lastLogin ? formatDateTime(user.lastLogin) : 'Never'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}

            {activeTab === 'subscription' ? (
              <form className="space-y-4" onSubmit={saveSubscription}>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block space-y-2">
                    <span className="text-sm font-semibold text-slate-700">Plan</span>
                    <select className={inputClassName} value={subscriptionForm.plan} onChange={(event) => setSubscriptionForm((current) => ({ ...current, plan: event.target.value }))}>
                      <option value="">Select plan</option>
                      {(detail?.billingPlans || []).map((plan) => (
                        <option key={plan.key} value={plan.key}>{plan.name}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block space-y-2">
                    <span className="text-sm font-semibold text-slate-700">Status</span>
                    <select className={inputClassName} value={subscriptionForm.status} onChange={(event) => setSubscriptionForm((current) => ({ ...current, status: event.target.value }))}>
                      <option value="">Select status</option>
                      <option value="trial">Trial</option>
                      <option value="active">Active</option>
                      <option value="past_due">Past Due</option>
                      <option value="inactive">Inactive</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </label>
                  <label className="block space-y-2">
                    <span className="text-sm font-semibold text-slate-700">User Limit</span>
                    <input type="number" min="1" className={inputClassName} value={subscriptionForm.userLimit} onChange={(event) => setSubscriptionForm((current) => ({ ...current, userLimit: event.target.value }))} />
                  </label>
                  <label className="block space-y-2">
                    <span className="text-sm font-semibold text-slate-700">Branch Limit</span>
                    <input type="number" min="1" className={inputClassName} value={subscriptionForm.branchLimit} onChange={(event) => setSubscriptionForm((current) => ({ ...current, branchLimit: event.target.value }))} />
                  </label>
                </div>
                <button type="submit" disabled={saving || !subscriptionForm.plan || !subscriptionForm.status} className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60">
                  {saving ? 'Saving...' : 'Save Subscription'}
                </button>
              </form>
            ) : null}

            {activeTab === 'workflow' ? (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-3">
                  <select className={inputClassName} value={selectedTemplateKey} onChange={(event) => setSelectedTemplateKey(event.target.value)}>
                    {(detail?.templates || []).map((template) => (
                      <option key={template.key} value={template.key}>{template.name}</option>
                    ))}
                  </select>
                  <button type="button" onClick={applyTemplate} disabled={saving || !selectedTemplateKey} className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60">
                    {saving ? 'Applying...' : 'Apply Template'}
                  </button>
                </div>
                {(detail?.workflows || []).map((workflow) => (
                  <div key={workflow._id} className="rounded-2xl border border-slate-200 p-4">
                    <p className="font-semibold text-slate-900">{workflow.country}</p>
                    <p className="mt-2 text-sm text-slate-500">Lead: {(workflow.leadStages || []).map((stage) => stage.label).join(' -> ')}</p>
                    <p className="mt-1 text-sm text-slate-500">Application: {(workflow.applicationStages || []).map((stage) => stage.label).join(' -> ')}</p>
                  </div>
                ))}
              </div>
            ) : null}

            {activeTab === 'forms' ? (
              <div className="grid gap-4 xl:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="font-semibold text-slate-900">Public Forms</p>
                  <div className="mt-3 space-y-3">
                    {(detail?.forms || []).map((form) => (
                      <div key={form._id} className="rounded-2xl bg-slate-50 p-4">
                        <p className="font-semibold text-slate-900">{form.name}</p>
                        <p className="mt-1 text-sm text-slate-500">{form.slug}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="font-semibold text-slate-900">QR Codes</p>
                  <div className="mt-3 space-y-3">
                    {(detail?.qrCodes || []).map((qr) => (
                      <div key={qr._id} className="rounded-2xl bg-slate-50 p-4">
                        <p className="font-semibold text-slate-900">{qr.label}</p>
                        <p className="mt-1 text-sm text-slate-500">{qr.scanCount || 0} scans / {qr.submissionCount || 0} submissions</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            {activeTab === 'website' ? (
              <div className="space-y-3">
                {(detail?.websiteIntegrations || []).map((integration) => (
                  <div key={integration._id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{integration.widgetType}</p>
                        <p className="mt-1 text-sm text-slate-500">{integration.embedMode} / {integration.sourceLabel}</p>
                      </div>
                      <StatusPill tone={integration.isActive ? 'completed' : 'overdue'}>{integration.isActive ? 'Active' : 'Inactive'}</StatusPill>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {activeTab === 'billing' ? (
              <div className="space-y-3">
                {(detail?.subscription?.paymentHistory || detail?.tenant?.billing?.paymentHistory || []).map((payment, index) => (
                  <div key={`${payment.invoiceNumber || 'payment'}-${index}`} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">{payment.invoiceNumber || payment.providerInvoiceId || 'Payment'}</p>
                        <p className="mt-1 text-sm text-slate-500">Due {formatDate(payment.dueAt)} / Paid {formatDate(payment.paidAt)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusPill tone={payment.status === 'paid' ? 'completed' : 'pending'}>{payment.status}</StatusPill>
                        <p className="font-semibold text-slate-900">{formatCurrency(payment.amount, payment.currency || 'USD')}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {activeTab === 'audit' ? (
              <div className="space-y-3">
                {(detail?.auditLogs || []).map((log) => (
                  <div key={log._id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">{log.action} on {log.resource}</p>
                        <p className="mt-1 text-sm text-slate-500">{log.userName || 'System'} / {formatDateTime(log.createdAt)}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {log.module ? <StatusPill tone="pending">{log.module}</StatusPill> : null}
                        <StatusPill tone={log.status === 'failure' ? 'overdue' : 'completed'}>{log.status || 'success'}</StatusPill>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </section>
        </section>

        <aside className="space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Health Score</p>
            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-4xl font-semibold text-slate-950">{detail?.health?.score || 0}</p>
              <BadgeCheck className="h-10 w-10 text-emerald-600" />
            </div>
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              {(detail?.health?.warnings || []).length ? (
                detail.health.warnings.map((warning) => (
                  <div key={warning} className="flex items-start gap-2 rounded-2xl bg-amber-50 px-3 py-2 text-amber-700">
                    <AlertTriangle className="mt-0.5 h-4 w-4" />
                    <span>{warning}</span>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl bg-emerald-50 px-3 py-2 text-emerald-700">
                  No active warnings. Tenant configuration is healthy.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Quick Links</p>
            <div className="mt-4 grid gap-3">
              <Link href="/admin/onboarding" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                <Sparkles className="h-4 w-4" />
                New Onboarding
              </Link>
              <Link href="/admin/templates" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                <Globe2 className="h-4 w-4" />
                Manage Templates
              </Link>
              <Link href="/admin/tenants" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                <CreditCard className="h-4 w-4" />
                Tenant Search
              </Link>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

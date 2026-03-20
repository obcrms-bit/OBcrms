'use client';

import { useEffect, useState } from 'react';
import { CreditCard, DollarSign, Receipt } from 'lucide-react';
import AppShell from '@/components/app/app-shell';
import {
  ErrorState,
  LoadingState,
  MetricCard,
  StatusPill,
  formatCurrency,
  formatDate,
} from '@/components/app/shared';
import { platformAPI } from '@/src/services/api';

export default function BillingPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [billing, setBilling] = useState(null);

  const loadBilling = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await platformAPI.getBillingOverview();
      setBilling(response.data?.data || null);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to load billing overview.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBilling();
  }, []);

  const cards = [
    {
      label: 'Plan',
      value: billing?.subscription?.plan || 'starter',
      helper: `${billing?.subscription?.status || 'trial'} status`,
      icon: CreditCard,
      accent: 'bg-slate-900',
    },
    {
      label: 'Invoice Revenue',
      value: formatCurrency(billing?.invoiceSummary?.paid || 0),
      helper: `${formatCurrency(billing?.invoiceSummary?.outstanding || 0)} outstanding`,
      icon: Receipt,
      accent: 'bg-sky-600',
    },
    {
      label: 'Commission Payouts',
      value: formatCurrency(billing?.commissionSummary?.paid || 0),
      helper: `${formatCurrency(billing?.commissionSummary?.pending || 0)} pending`,
      icon: DollarSign,
      accent: 'bg-emerald-600',
    },
  ];

  return (
    <AppShell
      title="Billing"
      description="Track tenant subscription status, payment history, invoice revenue, and commission payout exposure from one commercial SaaS control surface."
    >
      {loading ? <LoadingState label="Loading billing workspace..." /> : null}
      {!loading ? (
        <div className="space-y-6">
          {error ? <ErrorState message={error} onRetry={loadBilling} /> : null}

          <div className="grid gap-4 xl:grid-cols-3">
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

          <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Subscription
              </p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">
                Tenant plan and limits
              </h3>
              <div className="mt-6 space-y-4">
                <div className="rounded-3xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {billing?.subscription?.plan || 'starter'} plan
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {billing?.subscription?.billingCycle || 'monthly'} billing
                      </p>
                    </div>
                    <StatusPill tone={billing?.subscription?.status === 'active' ? 'completed' : 'pending'}>
                      {billing?.subscription?.status || 'trial'}
                    </StatusPill>
                  </div>
                  <p className="mt-4 text-sm text-slate-600">
                    Users: {billing?.subscription?.usage?.activeUsers || 0}/
                    {billing?.subscription?.userLimit || 0}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Branches: {billing?.subscription?.usage?.branches || 0}/
                    {billing?.subscription?.branchLimit || 0}
                  </p>
                </div>

                <div className="rounded-3xl border border-slate-200 p-4">
                  <p className="text-sm font-semibold text-slate-900">Feature gates</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {Object.entries(billing?.subscription?.featureAccess || {}).map(([key, value]) => (
                      <StatusPill key={key} tone={value ? 'completed' : 'lost'}>
                        {key}
                      </StatusPill>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Finance Timeline
              </p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">
                Recent invoices and payments
              </h3>
              <div className="mt-6 space-y-4">
                {(billing?.recentInvoices || []).map((invoice) => (
                  <div key={invoice._id} className="rounded-3xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{invoice.invoiceNumber}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          Due {formatDate(invoice.dueDate)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-slate-900">
                          {formatCurrency(invoice.totalAmount || 0, invoice.currency || 'USD')}
                        </p>
                        <StatusPill tone={invoice.status}>{invoice.status}</StatusPill>
                      </div>
                    </div>
                  </div>
                ))}

                {(billing?.paymentHistory || []).length ? (
                  <div className="rounded-3xl border border-slate-200 p-4">
                    <p className="text-sm font-semibold text-slate-900">Subscription payment history</p>
                    <div className="mt-4 space-y-3">
                      {billing.paymentHistory.map((payment, index) => (
                        <div key={`${payment.invoiceNumber || index}`} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                          <div>
                            <p className="font-medium text-slate-900">
                              {payment.invoiceNumber || 'Subscription invoice'}
                            </p>
                            <p className="text-xs text-slate-500">
                              {payment.paidAt ? formatDate(payment.paidAt) : formatDate(payment.dueAt)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-slate-900">
                              {formatCurrency(payment.amount || 0, payment.currency || 'USD')}
                            </p>
                            <StatusPill tone={payment.status}>{payment.status}</StatusPill>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </section>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}

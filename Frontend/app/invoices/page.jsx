'use client';
/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect, useMemo, useState } from 'react';
import { Plus, Send, Wallet } from 'lucide-react';
import AppShell from '@/components/app/app-shell';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  StatusPill,
  formatCurrency,
  formatDate,
} from '@/components/app/shared';
import { invoiceAPI, studentAPI } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

const defaultItem = () => ({ description: '', amount: '' });

export default function InvoicesPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [students, setStudents] = useState([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    studentId: '',
    dueDate: '',
    currency: 'USD',
    taxPercentage: 0,
    items: [defaultItem()],
  });

  const isAllowed = ['super_admin', 'admin', 'accountant'].includes(user?.role);

  const subTotal = useMemo(
    () =>
      form.items.reduce(
        (total, item) => total + Number(item.amount || 0),
        0
      ),
    [form.items]
  );
  const totalAmount = useMemo(
    () => subTotal + (subTotal * Number(form.taxPercentage || 0)) / 100,
    [form.taxPercentage, subTotal]
  );

  const loadInvoices = async () => {
    if (!isAllowed) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const [invoiceResponse, studentResponse] = await Promise.all([
        invoiceAPI.getInvoices(),
        studentAPI.getAllStudents(1, 100),
      ]);

      setInvoices(invoiceResponse.data?.data || []);
      setStudents(studentResponse.data?.data?.students || []);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to load invoices.'
      );
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadInvoices();
  }, [isAllowed]);

  const updateLineItem = (index, key, value) => {
    setForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item
      ),
    }));
  };

  const createInvoice = async () => {
    const payloadItems = form.items
      .filter((item) => item.description.trim() && Number(item.amount) > 0)
      .map((item) => ({
        description: item.description.trim(),
        amount: Number(item.amount),
      }));

    if (!form.studentId || !form.dueDate || payloadItems.length === 0) {
      setError('Select a student, a due date, and at least one valid invoice item.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await invoiceAPI.createInvoice({
        studentId: form.studentId,
        items: payloadItems,
        subTotal,
        taxPercentage: Number(form.taxPercentage || 0),
        totalAmount,
        currency: form.currency,
        dueDate: form.dueDate,
      });

      setForm({
        studentId: '',
        dueDate: '',
        currency: 'USD',
        taxPercentage: 0,
        items: [defaultItem()],
      });
      setShowCreatePanel(false);
      await loadInvoices();
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to create invoice.'
      );
    } finally {
      setSaving(false);
    }
  };

  const markAsPaid = async (invoiceId) => {
    try {
      await invoiceAPI.updateStatus(invoiceId, 'paid', 'bank_transfer');
      await loadInvoices();
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to mark invoice as paid.'
      );
    }
  };

  const sendInvoice = async (invoiceId) => {
    try {
      await invoiceAPI.sendEmail(invoiceId);
      await loadInvoices();
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to send invoice email.'
      );
    }
  };

  return (
    <AppShell
      title="Invoices"
      description="Generate invoices, send them, and update payment status against the deployed billing backend."
      actions={
        isAllowed ? (
          <button
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            onClick={() => setShowCreatePanel((current) => !current)}
            type="button"
          >
            <Plus className="h-4 w-4" />
            {showCreatePanel ? 'Hide creator' : 'Create invoice'}
          </button>
        ) : null
      }
    >
      {!isAllowed ? (
        <ErrorState message="This role does not have access to the invoice system." />
      ) : null}

      {isAllowed ? (
        <div className="space-y-6">
          {showCreatePanel ? (
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="grid gap-4 md:grid-cols-4">
                <label className="block space-y-2 md:col-span-2">
                  <span className="text-sm font-semibold text-slate-700">Student</span>
                  <select
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        studentId: event.target.value,
                      }))
                    }
                    value={form.studentId}
                  >
                    <option value="">Select a student</option>
                    {students.map((student) => (
                      <option key={student._id} value={student._id}>
                        {student.fullName || student.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-slate-700">Due Date</span>
                  <input
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        dueDate: event.target.value,
                      }))
                    }
                    type="date"
                    value={form.dueDate}
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-slate-700">Tax %</span>
                  <input
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        taxPercentage: event.target.value,
                      }))
                    }
                    type="number"
                    value={form.taxPercentage}
                  />
                </label>
              </div>

              <div className="mt-6 space-y-4">
                {form.items.map((item, index) => (
                  <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_auto]" key={index}>
                    <input
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
                      onChange={(event) =>
                        updateLineItem(index, 'description', event.target.value)
                      }
                      placeholder="Line item description"
                      value={item.description}
                    />
                    <input
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
                      onChange={(event) =>
                        updateLineItem(index, 'amount', event.target.value)
                      }
                      placeholder="Amount"
                      type="number"
                      value={item.amount}
                    />
                    <button
                      className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          items:
                            current.items.length === 1
                              ? [defaultItem()]
                              : current.items.filter((_, itemIndex) => itemIndex !== index),
                        }))
                      }
                      type="button"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <button
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      items: [...current.items, defaultItem()],
                    }))
                  }
                  type="button"
                >
                  Add line item
                </button>

                <div className="text-right">
                  <p className="text-sm text-slate-500">
                    Subtotal: {formatCurrency(subTotal, form.currency)}
                  </p>
                  <p className="text-lg font-semibold text-slate-900">
                    Total: {formatCurrency(totalAmount, form.currency)}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  onClick={() => setShowCreatePanel(false)}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={saving}
                  onClick={createInvoice}
                  type="button"
                >
                  {saving ? 'Creating...' : 'Create invoice'}
                </button>
              </div>
            </section>
          ) : null}

          {loading ? <LoadingState label="Loading invoices..." /> : null}
          {!loading && error ? <ErrorState message={error} onRetry={loadInvoices} /> : null}

          {!loading && !error ? (
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              {invoices.length === 0 ? (
                <EmptyState
                  description="Create the first invoice to enable the billing flow from frontend through PDF/email delivery."
                  title="No invoices yet"
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1040px] text-left">
                    <thead className="border-b border-slate-200 text-xs uppercase tracking-[0.2em] text-slate-500">
                      <tr>
                        <th className="pb-3">Invoice</th>
                        <th className="pb-3">Student</th>
                        <th className="pb-3">Amount</th>
                        <th className="pb-3">Due Date</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {invoices.map((invoice) => (
                        <tr key={invoice._id}>
                          <td className="py-4 font-semibold text-slate-900">
                            {invoice.invoiceNumber}
                          </td>
                          <td className="py-4 text-sm text-slate-600">
                            {invoice.studentId?.fullName || 'Unknown student'}
                          </td>
                          <td className="py-4 text-sm text-slate-600">
                            {formatCurrency(invoice.totalAmount, invoice.currency)}
                          </td>
                          <td className="py-4 text-sm text-slate-600">
                            {invoice.dueDate ? formatDate(invoice.dueDate) : 'Not set'}
                          </td>
                          <td className="py-4">
                            <StatusPill tone={invoice.status}>{invoice.status}</StatusPill>
                          </td>
                          <td className="py-4">
                            <div className="flex justify-end gap-2">
                              <button
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                onClick={() => sendInvoice(invoice._id)}
                                type="button"
                              >
                                <Send className="h-4 w-4" />
                                Send
                              </button>
                              {invoice.status !== 'paid' ? (
                                <button
                                  className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                                  onClick={() => markAsPaid(invoice._id)}
                                  type="button"
                                >
                                  <Wallet className="h-4 w-4" />
                                  Mark paid
                                </button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ) : null}
        </div>
      ) : null}
    </AppShell>
  );
}

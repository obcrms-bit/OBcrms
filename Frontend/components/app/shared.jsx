'use client';

import { AlertCircle, Inbox, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export const LEAD_STAGES = [
  { key: 'new', label: 'New' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'qualified', label: 'Qualified' },
  { key: 'counselling_scheduled', label: 'Counselling Scheduled' },
  { key: 'counselling_done', label: 'Counselling Done' },
  { key: 'application_started', label: 'Application Started' },
  { key: 'documents_pending', label: 'Documents Pending' },
  { key: 'application_submitted', label: 'Application Submitted' },
  { key: 'offer_received', label: 'Offer Received' },
  { key: 'visa_applied', label: 'Visa Applied' },
  { key: 'enrolled', label: 'Enrolled' },
  { key: 'lost', label: 'Lost' },
];

export const STAGE_STYLES = {
  new: 'bg-slate-100 text-slate-700',
  contacted: 'bg-blue-100 text-blue-700',
  qualified: 'bg-cyan-100 text-cyan-700',
  counselling_scheduled: 'bg-violet-100 text-violet-700',
  counselling_done: 'bg-purple-100 text-purple-700',
  application_started: 'bg-amber-100 text-amber-700',
  documents_pending: 'bg-orange-100 text-orange-700',
  application_submitted: 'bg-indigo-100 text-indigo-700',
  offer_received: 'bg-emerald-100 text-emerald-700',
  visa_applied: 'bg-teal-100 text-teal-700',
  enrolled: 'bg-green-100 text-green-700',
  lost: 'bg-rose-100 text-rose-700',
  pending: 'bg-amber-100 text-amber-700',
  due_today: 'bg-blue-100 text-blue-700',
  overdue: 'bg-rose-100 text-rose-700',
  completed: 'bg-emerald-100 text-emerald-700',
  converted: 'bg-emerald-100 text-emerald-700',
  converted_to_student: 'bg-emerald-100 text-emerald-700',
  closed_not_interested: 'bg-slate-200 text-slate-700',
  no_response: 'bg-orange-100 text-orange-700',
  sent: 'bg-blue-100 text-blue-700',
  paid: 'bg-emerald-100 text-emerald-700',
  draft: 'bg-slate-100 text-slate-700',
};

export const CATEGORY_STYLES = {
  hot: 'bg-rose-100 text-rose-700',
  warm: 'bg-amber-100 text-amber-700',
  cold: 'bg-sky-100 text-sky-700',
};

export const getLeadStageLabel = (status) =>
  LEAD_STAGES.find((stage) => stage.key === status)?.label ||
  String(status || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

export const formatDate = (value) => {
  if (!value) {
    return 'Not set';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Invalid date';
  }

  return date.toLocaleDateString();
};

export const formatDateTime = (value) => {
  if (!value) {
    return 'Not set';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Invalid date';
  }

  return date.toLocaleString();
};

export const formatCurrency = (amount, currency = 'USD') => {
  const numericAmount = Number(amount || 0);

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(numericAmount);
  } catch (error) {
    return `${numericAmount.toFixed(2)} ${currency}`;
  }
};

export const formatRoleLabel = (role) =>
  String(role || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

export const getInitials = (value = '') =>
  String(value)
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'TE';

export const upsertById = (items, nextItem) => {
  const nextItems = Array.isArray(items) ? [...items] : [];
  const existingIndex = nextItems.findIndex((item) => item.id === nextItem.id);

  if (existingIndex >= 0) {
    nextItems[existingIndex] = {
      ...nextItems[existingIndex],
      ...nextItem,
    };
  } else {
    nextItems.unshift(nextItem);
  }

  return nextItems;
};

export function StatusPill({ children, tone = 'new', className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
        STAGE_STYLES[tone] || 'bg-slate-100 text-slate-700',
        className
      )}
    >
      {children}
    </span>
  );
}

export function MetricCard({
  icon: Icon,
  label,
  value,
  helper,
  accent = 'bg-slate-900',
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            {label}
          </p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{value}</p>
          {helper ? (
            <p className="mt-2 text-sm text-slate-500">{helper}</p>
          ) : null}
        </div>
        <div
          className={cn(
            'flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-sm',
            accent
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export function LoadingState({ label = 'Loading workspace...' }) {
  return (
    <div className="flex min-h-[280px] items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white/70 p-8">
      <div className="flex items-center gap-3 text-slate-600">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm font-medium">{label}</span>
      </div>
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 text-rose-600" />
        <div>
          <p className="text-sm font-semibold text-rose-700">
            Something went wrong
          </p>
          <p className="mt-1 text-sm text-rose-600">{message}</p>
          {onRetry ? (
            <button
              className="mt-4 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
              onClick={onRetry}
              type="button"
            >
              Try again
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon: Icon = Inbox,
}) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mt-5 text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
        {description}
      </p>
      {actionLabel && onAction ? (
        <button
          className="mt-5 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          onClick={onAction}
          type="button"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

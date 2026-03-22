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
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-rose-100 text-rose-700',
  cancelled: 'bg-slate-200 text-slate-700',
  draft: 'bg-slate-100 text-slate-700',
  enquiry: 'bg-slate-100 text-slate-700',
  counselling: 'bg-blue-100 text-blue-700',
  docs: 'bg-amber-100 text-amber-700',
  lodge: 'bg-indigo-100 text-indigo-700',
  visa: 'bg-teal-100 text-teal-700',
  conditional: 'bg-violet-100 text-violet-700',
  final_offer: 'bg-emerald-100 text-emerald-700',
  cas: 'bg-cyan-100 text-cyan-700',
  coe: 'bg-sky-100 text-sky-700',
  submission: 'bg-indigo-100 text-indigo-700',
  pal: 'bg-fuchsia-100 text-fuchsia-700',
  review: 'bg-slate-100 text-slate-700',
  reminder: 'bg-orange-100 text-orange-700',
  approval: 'bg-violet-100 text-violet-700',
  document: 'bg-blue-100 text-blue-700',
  billing: 'bg-amber-100 text-amber-700',
  system: 'bg-slate-100 text-slate-700',
  crm: 'bg-cyan-100 text-cyan-700',
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

/**
 * @param {{ children: any; tone?: string; className?: string }} props
 */
export function StatusPill({ children, tone = 'new', className = '' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm ring-1 ring-inset ring-white/60',
        STAGE_STYLES[tone] || 'bg-slate-100 text-slate-700',
        className
      )}
    >
      {children}
    </span>
  );
}

/**
 * @param {{ icon: any; label: any; value: any; helper?: any; accent?: string }} props
 */
export function MetricCard({
  icon: Icon,
  label,
  value,
  helper = '',
  accent = 'bg-slate-900',
}) {
  return (
    <div className="ds-surface overflow-hidden">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="ds-stat-label">
            {label}
          </p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
          {helper ? (
            <p className="mt-2 text-sm text-slate-500">{helper}</p>
          ) : null}
        </div>
        <div
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg shadow-slate-200/70',
            accent
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

/**
 * @param {{ label?: string }} props
 */
export function LoadingState({ label = 'Loading workspace...' }) {
  return (
    <div className="ds-empty-panel flex min-h-[280px] items-center justify-center">
      <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-5 py-3 text-slate-600 shadow-sm">
        <Loader2 className="h-5 w-5 animate-spin text-teal-600" />
        <span className="text-sm font-medium">{label}</span>
      </div>
    </div>
  );
}

/**
 * @param {{ message: any; onRetry?: (() => void) | null }} props
 */
export function ErrorState({ message, onRetry = null }) {
  return (
    <div className="rounded-[1.75rem] border border-rose-200 bg-[linear-gradient(135deg,#fff5f5_0%,#fff1f2_100%)] p-6 shadow-[var(--ds-shadow-soft)]">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 text-rose-600" />
        <div>
          <p className="text-sm font-semibold text-rose-700">
            Something went wrong
          </p>
          <p className="mt-1 text-sm text-rose-600">{message}</p>
          {onRetry ? (
            <button
              className="ds-button mt-4 bg-rose-600 text-white hover:bg-rose-700"
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

/**
 * @param {{
 *   title: any;
 *   description: any;
 *   actionLabel?: any;
 *   onAction?: (() => void) | null;
 *   icon?: any;
 * }} props
 */
export function EmptyState({
  title,
  description,
  actionLabel = '',
  onAction = null,
  icon: Icon = Inbox,
}) {
  return (
    <div className="ds-empty-panel">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-500 shadow-inner">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mt-5 text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
        {description}
      </p>
      {actionLabel && onAction ? (
        <button
          className="ds-button-primary mt-5"
          onClick={onAction}
          type="button"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

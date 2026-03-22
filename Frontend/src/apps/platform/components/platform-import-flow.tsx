'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FileUp, UploadCloud, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PlatformPlanKey, TenantImportRow, TenantImportSummary } from '../platform.types';
import { StatusBadge } from './platform-ui';

export const IMPORT_STEPS = [
  { key: 1, label: 'Upload', description: 'Add a structured tenant file' },
  { key: 2, label: 'Validate', description: 'Inspect parsed rows and quality' },
  { key: 3, label: 'Fix', description: 'Resolve blocking issues inline' },
  { key: 4, label: 'Confirm', description: 'Approve tenants ready to create' },
  { key: 5, label: 'Done', description: 'Review results and export report' },
] as const;

export function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="rounded-[28px] border border-slate-200/80 bg-white/96 px-5 py-5 shadow-[0_24px_60px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-950/92">
      <div className="grid gap-4 lg:grid-cols-5">
        {IMPORT_STEPS.map((step, index) => {
          const isComplete = currentStep > step.key;
          const isActive = currentStep === step.key;

          return (
            <div key={step.key} className="flex items-center gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'flex h-11 w-11 items-center justify-center rounded-2xl border text-sm font-semibold transition',
                    isComplete &&
                      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300',
                    isActive &&
                      'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300',
                    !isComplete &&
                      !isActive &&
                      'border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400'
                  )}
                >
                  {String(step.key).padStart(2, '0')}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">
                    {step.label}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {step.description}
                  </p>
                </div>
              </div>
              {index < IMPORT_STEPS.length - 1 ? (
                <div className="hidden h-px flex-1 bg-slate-200 dark:bg-slate-800 lg:block" />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function UploadCard({
  file,
  loading,
  onFileSelect,
  onRemove,
  onValidate,
}: {
  file: File | null;
  loading?: boolean;
  onFileSelect: (file: File | null) => void;
  onRemove: () => void;
  onValidate: () => void;
}) {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <section className="rounded-[28px] border border-slate-200/80 bg-white/96 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-950/92">
      <div
        className={cn(
          'relative overflow-hidden rounded-[28px] border border-dashed px-6 py-10 text-center transition',
          isDragging
            ? 'border-sky-400 bg-sky-50/80 dark:bg-sky-500/10'
            : 'border-slate-300 bg-slate-50/80 dark:border-slate-700 dark:bg-slate-900/70'
        )}
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setIsDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          onFileSelect(event.dataTransfer.files?.[0] || null);
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.1),transparent_24%)]" />
        <div className="relative">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-slate-950 text-white dark:bg-slate-100 dark:text-slate-950">
            <UploadCloud className="h-7 w-7" />
          </div>
          <h3 className="mt-5 text-xl font-semibold tracking-[-0.03em] text-slate-950 dark:text-slate-50">
            Drag and drop a CSV or JSON tenant file
          </h3>
          <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
            Upload structured tenant onboarding data, validate it locally, then create consultancies only after the platform owner approves the final preview.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white">
              <FileUp className="h-4 w-4" />
              Choose file
              <input
                type="file"
                accept=".csv,.json"
                className="hidden"
                onChange={(event) => onFileSelect(event.target.files?.[0] || null)}
              />
            </label>
            <button
              type="button"
              onClick={onValidate}
              disabled={!file || loading}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              Validate file
            </button>
          </div>

          <div className="mt-4 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
            Accepted formats: CSV, JSON
          </div>
        </div>
      </div>

      {file ? (
        <div className="mt-5 flex flex-col gap-4 rounded-[24px] border border-slate-200/80 bg-slate-50/85 px-5 py-4 dark:border-slate-800 dark:bg-slate-900/70 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">{file.name}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {(file.size / 1024).toFixed(1)} KB
            </p>
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex items-center gap-2 self-start rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900"
          >
            <X className="h-4 w-4" />
            Remove file
          </button>
        </div>
      ) : null}
    </section>
  );
}

export function ValidationSummary({ summary }: { summary: TenantImportSummary }) {
  const cards = [
    { label: 'Total rows', value: summary.totalRows, tone: 'neutral' as const },
    { label: 'Valid rows', value: summary.validRows, tone: 'success' as const },
    { label: 'Warnings', value: summary.warningRows, tone: 'warning' as const },
    { label: 'Errors', value: summary.errorRows, tone: 'danger' as const },
    { label: 'Ready to create', value: summary.tenantsToCreate, tone: 'info' as const },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-[24px] border border-slate-200/80 bg-white/96 px-5 py-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-950/92"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            {card.label}
          </p>
          <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950 dark:text-slate-50">
            {card.value}
          </p>
          <div className="mt-4">
            <StatusBadge
              label={card.label}
              tone={
                card.tone === 'success'
                  ? 'success'
                  : card.tone === 'warning'
                    ? 'warning'
                    : card.tone === 'danger'
                      ? 'danger'
                      : card.tone === 'info'
                        ? 'info'
                        : 'neutral'
              }
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ErrorBadge({ status }: { status: TenantImportRow['status'] }) {
  return (
    <StatusBadge
      label={status}
      tone={
        status === 'valid' ? 'success' : status === 'warning' ? 'warning' : 'danger'
      }
    />
  );
}

export function EditableCell({
  value,
  field,
  rowId,
  error,
  editable,
  onChange,
}: {
  value: string;
  field: 'name' | 'domain' | 'ownerEmail' | 'country' | 'branches' | 'plan';
  rowId: string;
  error?: string;
  editable?: boolean;
  onChange?: (rowId: string, field: string, value: string | PlatformPlanKey) => void;
}) {
  if (!editable || !onChange) {
    return (
      <div>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{value || '—'}</p>
        {error ? <p className="mt-1 text-xs text-rose-600 dark:text-rose-300">{error}</p> : null}
      </div>
    );
  }

  if (field === 'plan') {
    return (
      <div>
        <select
          value={value}
          onChange={(event) =>
            onChange(rowId, field, event.target.value as PlatformPlanKey)
          }
          className={cn(
            'h-10 w-full rounded-2xl border px-3 text-sm outline-none transition',
            error
              ? 'border-rose-200 bg-rose-50 text-rose-700 focus:ring-4 focus:ring-rose-500/10 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200'
              : 'border-slate-200 bg-white text-slate-900 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100'
          )}
        >
          <option value="starter">Starter</option>
          <option value="growth">Growth</option>
          <option value="enterprise">Enterprise</option>
        </select>
        {error ? <p className="mt-1 text-xs text-rose-600 dark:text-rose-300">{error}</p> : null}
      </div>
    );
  }

  return (
    <div>
      <input
        value={value}
        onChange={(event) => onChange(rowId, field, event.target.value)}
        className={cn(
          'h-10 w-full rounded-2xl border px-3 text-sm outline-none transition',
          error
            ? 'border-rose-200 bg-rose-50 text-rose-700 placeholder:text-rose-400 focus:ring-4 focus:ring-rose-500/10 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200'
            : 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100'
        )}
      />
      {error ? <p className="mt-1 text-xs text-rose-600 dark:text-rose-300">{error}</p> : null}
    </div>
  );
}

export function PreviewTable({
  rows,
  editable = false,
  onRowChange,
}: {
  rows: TenantImportRow[];
  editable?: boolean;
  onRowChange?: (rowId: string, field: string, value: string | PlatformPlanKey) => void;
}) {
  const visibleRows = useMemo(() => rows, [rows]);

  return (
    <div className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/96 shadow-[0_24px_60px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-950/92">
      <div className="overflow-x-auto">
        <table className="min-w-[1200px] w-full">
          <thead className="sticky top-0 z-10 bg-white/95 backdrop-blur dark:bg-slate-950/95">
            <tr className="border-b border-slate-200/80 dark:border-slate-800">
              {[
                'Name',
                'Domain',
                'Plan',
                'Owner Email',
                'Country',
                'Branches',
                'Status',
              ].map((header) => (
                <th
                  key={header}
                  className="px-4 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {visibleRows.map((row) => (
                <motion.tr
                  key={row.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="border-b border-slate-100 align-top transition hover:bg-slate-50/80 dark:border-slate-900 dark:hover:bg-slate-900/70"
                >
                  <td className="px-4 py-4">
                    <EditableCell rowId={row.id} field="name" value={row.name} error={row.errors.name} editable={editable} onChange={onRowChange} />
                  </td>
                  <td className="px-4 py-4">
                    <EditableCell rowId={row.id} field="domain" value={row.domain} error={row.errors.domain} editable={editable} onChange={onRowChange} />
                  </td>
                  <td className="px-4 py-4">
                    <EditableCell rowId={row.id} field="plan" value={row.plan} error={row.errors.plan} editable={editable} onChange={onRowChange} />
                  </td>
                  <td className="px-4 py-4">
                    <EditableCell rowId={row.id} field="ownerEmail" value={row.ownerEmail} error={row.errors.ownerEmail} editable={editable} onChange={onRowChange} />
                  </td>
                  <td className="px-4 py-4">
                    <EditableCell rowId={row.id} field="country" value={row.country} error={row.errors.country} editable={editable} onChange={onRowChange} />
                  </td>
                  <td className="px-4 py-4">
                    <EditableCell rowId={row.id} field="branches" value={row.branches.join(' | ')} error={row.errors.branches} editable={editable} onChange={onRowChange} />
                    {row.warnings.length ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {row.warnings.map((warning) => (
                          <span key={warning} className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                            {warning}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    {row.runtimeError ? (
                      <p className="mt-2 text-xs text-rose-600 dark:text-rose-300">{row.runtimeError}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-4">
                    <div className="space-y-2">
                      <ErrorBadge status={row.status} />
                      {row.createdTenantId ? (
                        <p className="text-xs font-medium text-emerald-600 dark:text-emerald-300">
                          Created: {row.createdTenantId}
                        </p>
                      ) : null}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function SuccessSummary({
  rows,
  onDownloadReport,
  onImportMore,
  onOpenTenants,
}: {
  rows: TenantImportRow[];
  onDownloadReport: () => void;
  onImportMore: () => void;
  onOpenTenants: () => void;
}) {
  const createdCount = rows.filter((row) => row.createdTenantId).length;
  const failedCount = rows.filter((row) => row.runtimeError).length;
  const warningCount = rows.filter((row) => row.warnings.length).length;

  return (
    <section className="rounded-[30px] border border-slate-200/80 bg-white/96 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-950/92">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div>
          <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-emerald-500/12 text-emerald-600 dark:bg-emerald-500/18 dark:text-emerald-300">
            <FileUp className="h-7 w-7" />
          </div>
          <h3 className="mt-5 text-2xl font-semibold tracking-[-0.04em] text-slate-950 dark:text-slate-50">
            Tenant import finished
          </h3>
          <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
            Review the creation summary, export the report, and move straight into tenant management without leaving the owner flow.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" onClick={onDownloadReport} className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white">
              Download report
            </button>
            <button type="button" onClick={onOpenTenants} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900">
              Go to tenant management
            </button>
            <button type="button" onClick={onImportMore} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900">
              Import more
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            { label: 'Created', value: createdCount, tone: 'success' as const },
            { label: 'Failed', value: failedCount, tone: 'danger' as const },
            { label: 'Warnings', value: warningCount, tone: 'warning' as const },
          ].map((card) => (
            <div key={card.label} className="rounded-[24px] border border-slate-200/80 bg-slate-50/85 px-5 py-5 dark:border-slate-800 dark:bg-slate-900/70">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                {card.label}
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950 dark:text-slate-50">
                {card.value}
              </p>
              <div className="mt-4">
                <StatusBadge
                  label={card.label}
                  tone={
                    card.tone === 'success'
                      ? 'success'
                      : card.tone === 'warning'
                        ? 'warning'
                        : 'danger'
                  }
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

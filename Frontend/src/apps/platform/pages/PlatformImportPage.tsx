'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Download,
  FileJson2,
  FileSpreadsheet,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { superAdminAPI } from '@/src/services/api';
import { useTenantStore } from '@/src/stores/AppDataStore';
import {
  downloadImportReport,
  downloadImportTemplate,
  parseImportFile,
  summarizeImportRows,
  updateImportRow,
  validateImportRows,
} from '../platform-import.utils';
import type { TenantImportRow } from '../platform.types';
import { buildPlatformTenantDataset } from '../platform.utils';
import {
  IMPORT_STEPS,
  PreviewTable,
  StepIndicator,
  SuccessSummary,
  UploadCard,
  ValidationSummary,
} from '../components/platform-import-flow';
import { EmptyResultsState, PageHeading, ProgressBar, StatusBadge } from '../components/platform-ui';

const createTenantPayload = (row: TenantImportRow) => ({
  consultancy: {
    name: row.name,
    email: row.ownerEmail,
    country: row.country,
    website: `https://${row.domain}.trustcloud.app`,
  },
  adminUser: {
    name: `${row.name} Admin`,
    email: row.ownerEmail,
    password: row.tempPassword,
  },
  plan: {
    key: row.plan,
    status: 'trial',
    billingCycle: 'monthly',
  },
  branches: row.branches.map((branch, index) => ({
    name: branch,
    code: `BR${index + 1}`,
    country: row.country,
    city: branch,
  })),
});

export default function PlatformImportPage() {
  const router = useRouter();
  const { overview, tenants, loadOverview, loadTenants } = useTenantStore();
  const [file, setFile] = useState<File | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [rows, setRows] = useState<TenantImportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showOnlyErrors, setShowOnlyErrors] = useState(false);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    void Promise.all([loadOverview().catch(() => null), loadTenants({}).catch(() => null)]);
  }, [loadOverview, loadTenants]);

  const existingRecords = useMemo(
    () => buildPlatformTenantDataset(tenants || [], overview?.billingPlans || []),
    [overview?.billingPlans, tenants]
  );

  const existingDomains = useMemo(
    () => existingRecords.map((record) => record.domain.toLowerCase()),
    [existingRecords]
  );

  const existingEmails = useMemo(
    () => existingRecords.map((record) => record.ownerEmail.toLowerCase()),
    [existingRecords]
  );

  const summary = useMemo(() => summarizeImportRows(rows), [rows]);

  const visibleRows = useMemo(
    () => (showOnlyErrors ? rows.filter((row) => row.status === 'error') : rows),
    [rows, showOnlyErrors]
  );

  const handleValidate = useCallback(async () => {
    if (!file) {
      setActionError('Choose a CSV or JSON file first.');
      return;
    }

    setLoading(true);
    setActionError('');

    try {
      const parsedRows = await parseImportFile(file);
      const validatedRows = validateImportRows(parsedRows, existingDomains, existingEmails);
      setRows(validatedRows);
      setCurrentStep(2);
      setShowOnlyErrors(false);
    } catch (error: any) {
      setActionError(
        error?.message || 'Failed to parse the import file. Check the structure and try again.'
      );
    } finally {
      setLoading(false);
    }
  }, [existingDomains, existingEmails, file]);

  const handleUpdateRow = useCallback(
    (rowId: string, field: string, value: string) => {
      const nextRows = updateImportRow(rows, rowId, field as keyof TenantImportRow, value);
      setRows(validateImportRows(nextRows, existingDomains, existingEmails));
    },
    [existingDomains, existingEmails, rows]
  );

  const handleConfirmImport = useCallback(async () => {
    if (!rows.length || summary.errorRows > 0) {
      return;
    }

    setProcessing(true);
    setActionError('');
    setProgress(0);

    const importableRows = rows.filter((row) => row.status !== 'error');
    const nextRows = [...rows];

    for (let index = 0; index < importableRows.length; index += 1) {
      const row = importableRows[index];
      const rowIndex = nextRows.findIndex((item) => item.id === row.id);

      try {
        const response = await superAdminAPI.createTenant(createTenantPayload(row));
        const tenantId =
          response?.data?.data?.tenant?.id ||
          response?.data?.data?.tenant?._id ||
          response?.data?.data?.tenant?.code ||
          '';

        nextRows[rowIndex] = {
          ...nextRows[rowIndex],
          createdTenantId: tenantId,
          runtimeError: '',
        };
      } catch (error: any) {
        nextRows[rowIndex] = {
          ...nextRows[rowIndex],
          runtimeError:
            error?.response?.data?.message ||
            error?.message ||
            'Tenant creation failed for this row.',
        };
      }

      setRows([...nextRows]);
      setProgress(Math.round(((index + 1) / Math.max(importableRows.length, 1)) * 100));
    }

    setProcessing(false);
    setCurrentStep(5);
    await Promise.all([loadOverview().catch(() => null), loadTenants({}).catch(() => null)]);
  }, [loadOverview, loadTenants, rows, summary.errorRows]);

  const processingLabel = useMemo(() => {
    const current = IMPORT_STEPS.find((step) => step.key === currentStep);
    return current?.label || 'Import';
  }, [currentStep]);

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Bulk Tenant Onboarding"
        title="Import Tenants"
        subtitle="Bulk onboard consultancies using a structured CSV or JSON file with validation, inline fixes, and a safe owner approval checkpoint before any tenants are created."
        actions={
          <>
            <button
              type="button"
              onClick={() => downloadImportTemplate('csv')}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white"
            >
              <Download className="h-4 w-4" />
              Download Template
            </button>
            <Link
              href="/platform/settings?panel=integrations"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              View Documentation
            </Link>
          </>
        }
      />

      {actionError ? (
        <div className="rounded-[26px] border border-rose-200/80 bg-rose-50/90 px-5 py-4 text-sm text-rose-700 shadow-[0_18px_40px_rgba(244,63,94,0.08)] dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">
          {actionError}
        </div>
      ) : null}

      <StepIndicator currentStep={currentStep} />

      {currentStep === 1 ? (
        <div className="space-y-6">
          <UploadCard
            file={file}
            loading={loading}
            onFileSelect={(nextFile) => {
              setFile(nextFile);
              setRows([]);
              setCurrentStep(1);
              setActionError('');
            }}
            onRemove={() => {
              setFile(null);
              setRows([]);
              setCurrentStep(1);
            }}
            onValidate={handleValidate}
          />

          <section className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="rounded-[28px] border border-slate-200/80 bg-white/96 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-950/92">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white dark:bg-slate-100 dark:text-slate-950">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
                    Template Format
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-slate-950 dark:text-slate-50">
                    Expected file structure
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    Keep the file flat and owner-safe: one row per tenant with branches supplied as an array in JSON or pipe-separated values in CSV.
                  </p>
                </div>
              </div>

              <pre className="mt-5 overflow-x-auto rounded-[24px] bg-slate-950 p-5 text-sm leading-7 text-slate-200">
{`[
  {
    "name": "Trust Education",
    "domain": "trusteducation",
    "plan": "enterprise",
    "ownerEmail": "admin@trust.com",
    "country": "Nepal",
    "branches": ["Kathmandu", "Pokhara"]
  }
]`}
              </pre>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => downloadImportTemplate('csv')}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Download sample CSV
                </button>
                <button
                  type="button"
                  onClick={() => downloadImportTemplate('json')}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
                >
                  <FileJson2 className="h-4 w-4" />
                  Download JSON template
                </button>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200/80 bg-white/96 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-950/92">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/12 text-amber-600 dark:bg-amber-500/18 dark:text-amber-300">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
                    Validation Rules
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-slate-950 dark:text-slate-50">
                    What gets checked before creation
                  </h3>
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {[
                  'Name is required',
                  'Domain must be unique',
                  'Owner email must be valid',
                  'Plan must be starter, growth, or enterprise',
                  'Country is required',
                  'Branches must be a valid list',
                ].map((rule) => (
                  <div
                    key={rule}
                    className="rounded-[20px] border border-slate-200/80 bg-slate-50/85 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300"
                  >
                    {rule}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      ) : null}

      {currentStep === 2 ? (
        <div className="space-y-6">
          <ValidationSummary summary={summary} />
          {rows.length ? (
            <>
              <PreviewTable rows={rows} />
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-slate-200/80 bg-white/96 px-5 py-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-950/92">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge label={`${summary.validRows} valid`} tone="success" />
                  <StatusBadge label={`${summary.warningRows} warning`} tone="warning" />
                  <StatusBadge
                    label={`${summary.errorRows} error`}
                    tone={summary.errorRows ? 'danger' : 'success'}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentStep(summary.errorRows ? 3 : 4)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white"
                >
                  {summary.errorRows ? 'Fix errors' : 'Continue to confirm'}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </>
          ) : (
            <EmptyResultsState
              title="No rows parsed"
              description="Upload a valid CSV or JSON file to preview tenant rows and validation status."
            />
          )}
        </div>
      ) : null}

      {currentStep === 3 ? (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-slate-200/80 bg-white/96 px-5 py-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-950/92">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                Error Fix Mode
              </p>
              <h3 className="mt-2 text-lg font-semibold text-slate-950 dark:text-slate-50">
                Resolve blocking rows inline
              </h3>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setShowOnlyErrors((current) => !current)}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                {showOnlyErrors ? 'Show all rows' : 'Show only errors'}
              </button>
              <button
                type="button"
                onClick={() => setRows(validateImportRows(rows, existingDomains, existingEmails))}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                <RefreshCw className="h-4 w-4" />
                Re-run validation
              </button>
            </div>
          </div>

          <ValidationSummary summary={summary} />
          <PreviewTable rows={visibleRows} editable onRowChange={handleUpdateRow} />

          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              Back to validation
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep(4)}
              disabled={summary.errorRows > 0}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white"
            >
              Continue to confirm
            </button>
          </div>
        </div>
      ) : null}

      {currentStep === 4 ? (
        <div className="space-y-6">
          <section className="rounded-[30px] border border-slate-200/80 bg-white/96 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-950/92">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
                  Confirmation
                </p>
                <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950 dark:text-slate-50">
                  Ready to create {summary.tenantsToCreate} tenant{summary.tenantsToCreate === 1 ? '' : 's'}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  Every valid and warning row will be sent through the existing tenant creation contract. Error rows stay blocked until corrected.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <StatusBadge label={`${summary.validRows} valid`} tone="success" />
                  <StatusBadge label={`${summary.warningRows} warning`} tone="warning" />
                  <StatusBadge
                    label={`${summary.errorRows} blocked`}
                    tone={summary.errorRows ? 'danger' : 'success'}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {[
                  { label: 'Total rows', value: summary.totalRows, helper: 'Parsed from the uploaded file' },
                  { label: 'Tenants to create', value: summary.tenantsToCreate, helper: 'Valid and warning rows only' },
                  { label: 'Errors remaining', value: summary.errorRows, helper: 'Must be zero before a full clean import' },
                  { label: 'Warnings', value: summary.warningRows, helper: 'Creation allowed with owner awareness' },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[24px] border border-slate-200/80 bg-slate-50/85 px-5 py-5 dark:border-slate-800 dark:bg-slate-900/70"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      {item.label}
                    </p>
                    <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950 dark:text-slate-50">
                      {item.value}
                    </p>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{item.helper}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setCurrentStep(summary.errorRows ? 3 : 2)}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                Back to fix
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={processing || summary.errorRows > 0 || !summary.tenantsToCreate}
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white"
              >
                Confirm import
              </button>
            </div>
          </section>

          {processing ? (
            <section className="rounded-[30px] border border-slate-200/80 bg-white/96 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-950/92">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-[24px] bg-sky-500/12 text-sky-600 dark:bg-sky-500/18 dark:text-sky-300">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                </div>
                <div className="flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
                    Processing
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-slate-950 dark:text-slate-50">
                    Creating tenants...
                  </h3>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    {processingLabel} step in progress. Each row is being sent through the existing creation flow and recorded with a success or failure result.
                  </p>
                  <ProgressBar className="mt-5" value={progress} tone="info" />
                  <div className="mt-3 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                    <span>{progress}% complete</span>
                    <span>{summary.tenantsToCreate} total queued</span>
                  </div>
                </div>
              </div>
            </section>
          ) : null}
        </div>
      ) : null}

      {currentStep === 5 ? (
        <SuccessSummary
          rows={rows}
          onDownloadReport={() => downloadImportReport(rows)}
          onImportMore={() => {
            setFile(null);
            setRows([]);
            setCurrentStep(1);
            setProgress(0);
            setActionError('');
          }}
          onOpenTenants={() => router.push('/platform/tenants')}
        />
      ) : null}
    </div>
  );
}

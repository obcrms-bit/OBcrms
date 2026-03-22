'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  BrainCircuit,
  Download,
  FileSpreadsheet,
  FileText,
  RefreshCcw,
  Search,
  Sparkles,
  UploadCloud,
  Wand2,
} from 'lucide-react';
import AppShell from '@/components/app/app-shell';
import {
  DataTableSurface,
  FilterToolbar,
  InlineStats,
  PageHero,
  SectionCard,
  SectionHeader,
} from '@/components/app/design-system';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  StatusPill,
} from '@/components/app/shared';
import { intelligenceAPI } from '@/src/services/api';
import {
  getSelectedBranchId,
  WORKSPACE_BRANCH_EVENT,
} from '@/src/services/workspace';

const IntelligenceReportView = dynamic(() => import('./report-view'), {
  loading: () => <LoadingState label="Loading intelligence visualizations..." />,
});

const formatBytes = (value = 0) => {
  if (!value) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB'];
  let index = 0;
  let nextValue = Number(value);

  while (nextValue >= 1024 && index < units.length - 1) {
    nextValue /= 1024;
    index += 1;
  }

  return `${nextValue.toFixed(nextValue > 10 ? 0 : 1)} ${units[index]}`;
};

const DATASET_TYPE_LABELS = {
  leads: 'Leads',
  students: 'Students',
  applications: 'Applications',
  revenue: 'Revenue',
  operations: 'Operations',
};

const getUploadHint = (file) =>
  file
    ? `${file.name} · ${formatBytes(file.size)}`
    : 'CSV, Excel, ODS, JSON, and PDF are supported. Files are parsed in memory and analyzed automatically.';

export default function IntelligenceWorkspace() {
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [overview, setOverview] = useState(null);
  const [datasets, setDatasets] = useState([]);
  const [reports, setReports] = useState([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState('');
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [datasetSearch, setDatasetSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [pageError, setPageError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [uploadFile, setUploadFile] = useState(null);

  const loadWorkspace = async (branchId = selectedBranchId) => {
    setIsLoading(true);
    setPageError('');

    try {
      const params = branchId ? { branchId } : {};
      const [overviewResponse, datasetsResponse, reportsResponse] = await Promise.all([
        intelligenceAPI.getOverview(params),
        intelligenceAPI.listDatasets({
          ...params,
          ...(datasetSearch ? { search: datasetSearch } : {}),
        }),
        intelligenceAPI.listReports(params),
      ]);

      const nextOverview = overviewResponse.data?.data || null;
      const nextDatasets = datasetsResponse.data?.data?.datasets || [];
      const nextReports = reportsResponse.data?.data?.reports || [];

      setOverview(nextOverview);
      setDatasets(nextDatasets);
      setReports(nextReports);

      const nextSelectedId =
        selectedDatasetId && nextDatasets.some((dataset) => dataset._id === selectedDatasetId)
          ? selectedDatasetId
          : nextDatasets[0]?._id || '';
      setSelectedDatasetId(nextSelectedId);
    } catch (error) {
      setPageError(
        error?.response?.data?.message ||
          error?.message ||
          'Failed to load the company intelligence workspace.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const initialBranchId = getSelectedBranchId();
    setSelectedBranchId(initialBranchId);
    loadWorkspace(initialBranchId);

    const handleBranchChange = (event) => {
      const branchId = event?.detail?.branchId || '';
      setSelectedBranchId(branchId);
      setSelectedDatasetId('');
      loadWorkspace(branchId);
    };

    window.addEventListener(WORKSPACE_BRANCH_EVENT, handleBranchChange);
    return () => {
      window.removeEventListener(WORKSPACE_BRANCH_EVENT, handleBranchChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedDatasetId) {
      setSelectedDataset(null);
      setSelectedReport(null);
      return;
    }

    let active = true;

    const loadDatasetDetail = async () => {
      try {
        const response = await intelligenceAPI.getDatasetById(selectedDatasetId);
        if (!active) {
          return;
        }
        const nextDataset = response.data?.data?.dataset || null;
        const nextReport = response.data?.data?.report || null;
        setSelectedDataset(nextDataset);
        setSelectedReport(nextReport);
      } catch (error) {
        if (!active) {
          return;
        }
        setPageError(
          error?.response?.data?.message ||
            error?.message ||
            'Failed to load dataset detail.'
        );
      }
    };

    loadDatasetDetail();

    return () => {
      active = false;
    };
  }, [selectedDatasetId]);

  const filteredDatasets = useMemo(() => {
    if (!datasetSearch.trim()) {
      return datasets;
    }

    const query = datasetSearch.trim().toLowerCase();
    return datasets.filter((dataset) =>
      [dataset.name, dataset.originalFileName, ...(dataset.datasetTypes || [])]
        .join(' ')
        .toLowerCase()
        .includes(query)
    );
  }, [datasetSearch, datasets]);

  const statItems = useMemo(
    () => [
      {
        label: 'Datasets',
        value: overview?.totals?.datasets || 0,
        helper: 'Tenant-scoped uploads',
      },
      {
        label: 'Reports',
        value: overview?.totals?.reports || 0,
        helper: 'White-labeled exports ready',
      },
      {
        label: 'Analyzed Records',
        value: overview?.totals?.records || 0,
        helper: 'Cleaned records retained',
      },
      {
        label: 'Average Conversion',
        value: `${overview?.totals?.averageConversion || 0}%`,
        helper: 'Across recent datasets',
      },
    ],
    [overview]
  );

  const handleFileSelection = (file) => {
    if (!file) {
      return;
    }

    setUploadFile(file);
    if (!uploadName.trim()) {
      setUploadName(String(file.name || '').replace(/\.[^.]+$/, ''));
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) {
      setPageError('Select a dataset file before uploading.');
      return;
    }

    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('name', uploadName || uploadFile.name.replace(/\.[^.]+$/, ''));
    if (selectedBranchId) {
      formData.append('branchId', selectedBranchId);
    }

    setIsUploading(true);
    setPageError('');
    setActionMessage('');

    try {
      const response = await intelligenceAPI.uploadDataset(formData);
      const nextDataset = response.data?.data?.dataset || null;
      const nextReport = response.data?.data?.report || null;

      setActionMessage('Dataset uploaded, cleaned, mapped, and analyzed successfully.');
      setUploadFile(null);
      setUploadName('');
      await loadWorkspace(selectedBranchId);
      if (nextDataset?._id) {
        setSelectedDatasetId(nextDataset._id);
        setSelectedDataset(nextDataset);
        setSelectedReport(nextReport);
      }
    } catch (error) {
      setPageError(
        error?.response?.data?.message ||
          error?.message ||
          'Failed to upload the dataset.'
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleReanalyze = async () => {
    if (!selectedDataset?._id) {
      return;
    }

    setIsReanalyzing(true);
    setPageError('');

    try {
      const response = await intelligenceAPI.reanalyzeDataset(selectedDataset._id);
      setSelectedDataset(response.data?.data?.dataset || null);
      setSelectedReport(response.data?.data?.report || null);
      setActionMessage('Insights refreshed from the cleaned dataset.');
      await loadWorkspace(selectedBranchId);
    } catch (error) {
      setPageError(
        error?.response?.data?.message ||
          error?.message ||
          'Failed to reanalyze the dataset.'
      );
    } finally {
      setIsReanalyzing(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedDataset?._id) {
      return;
    }

    setPageError('');

    try {
      const response = await intelligenceAPI.createDatasetReport(selectedDataset._id);
      setSelectedReport(response.data?.data?.report || null);
      setActionMessage('Report generated successfully.');
      await loadWorkspace(selectedBranchId);
    } catch (error) {
      setPageError(
        error?.response?.data?.message ||
          error?.message ||
          'Failed to generate report.'
      );
    }
  };

  const handleDownloadPdf = async () => {
    if (!selectedReport?._id) {
      return;
    }

    try {
      const response = await intelligenceAPI.downloadReportPdf(selectedReport._id);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = blobUrl;
      anchor.download = `${selectedReport.title || 'company-intelligence-report'}.pdf`;
      anchor.click();
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      setPageError(
        error?.response?.data?.message ||
          error?.message ||
          'Failed to download PDF report.'
      );
    }
  };

  const handleCopyShareLink = async () => {
    if (!selectedReport?._id) {
      return;
    }

    try {
      const response = await intelligenceAPI.updateReportSharing(selectedReport._id, {
        shareEnabled: true,
      });
      const nextReport = response.data?.data?.report || selectedReport;
      setSelectedReport(nextReport);
      if (nextReport?.shareUrl) {
        await navigator.clipboard.writeText(nextReport.shareUrl);
        setActionMessage('Share link copied to clipboard.');
      }
    } catch (error) {
      setPageError(
        error?.response?.data?.message ||
          error?.message ||
          'Failed to generate share link.'
      );
    }
  };

  if (isLoading) {
    return (
      <AppShell
        title="Company Intelligence Workspace"
        description="Upload company data, map fields automatically, and generate white-labeled intelligence reports."
      >
        <LoadingState label="Preparing the intelligence workspace..." />
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Company Intelligence Workspace"
      description="Upload structured company data, auto-clean inconsistencies, infer missing mappings, and turn it into branded intelligence reports."
      actions={
        <div className="flex flex-wrap gap-3">
          <button className="ds-button" onClick={handleReanalyze} type="button" disabled={!selectedDataset || isReanalyzing}>
            <RefreshCcw className={`h-4 w-4 ${isReanalyzing ? 'animate-spin' : ''}`} />
            Refresh insights
          </button>
          <button className="ds-button-primary" onClick={handleGenerateReport} type="button" disabled={!selectedDataset}>
            <Sparkles className="h-4 w-4" />
            Generate report
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {pageError ? <ErrorState message={pageError} onRetry={() => loadWorkspace(selectedBranchId)} /> : null}
        {actionMessage ? (
          <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-700">
            {actionMessage}
          </div>
        ) : null}

        <PageHero
          eyebrow="AI-Powered Operations"
          title="Turn uploaded business data into structured company intelligence"
          description="The workspace parses CSV, Excel, ODS, JSON, and PDF uploads in memory, cleans duplicates and missing values, infers likely business fields, and produces white-labeled dashboards and report exports."
          aside={
            <SectionCard tone="accent">
              <SectionHeader
                eyebrow="Current tenant state"
                title="Live intelligence coverage"
                description="Recent upload volume and analysis readiness for the selected branch scope."
              />
              <InlineStats className="mt-6" items={statItems} columns={2} />
            </SectionCard>
          }
        />

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <SectionCard>
            <SectionHeader
              eyebrow="Upload Center"
              title="Ingest company datasets securely"
              description="Files are parsed and analyzed immediately after upload. Data preview, schema detection, duplicate removal, and issue detection are generated automatically."
            />

            <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
              <div
                className={`rounded-[1.75rem] border-2 border-dashed p-8 transition ${
                  dragActive
                    ? 'border-teal-500 bg-teal-50'
                    : 'border-slate-300 bg-slate-50'
                }`}
                onDragEnter={(event) => {
                  event.preventDefault();
                  setDragActive(true);
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={(event) => {
                  event.preventDefault();
                  setDragActive(false);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragActive(false);
                  handleFileSelection(event.dataTransfer?.files?.[0]);
                }}
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-white text-slate-700 shadow-sm">
                  <UploadCloud className="h-7 w-7" />
                </div>
                <h3 className="mt-5 text-xl font-semibold text-slate-900">
                  Drag and drop a dataset
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {getUploadHint(uploadFile)}
                </p>
                <label className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                  <FileSpreadsheet className="h-4 w-4" />
                  Choose file
                  <input
                    className="hidden"
                    type="file"
                    accept=".csv,.xlsx,.xls,.ods,.json,.pdf"
                    onChange={(event) => handleFileSelection(event.target.files?.[0])}
                  />
                </label>
              </div>

              <div className="space-y-4 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Dataset name
                  </label>
                  <input
                    className="ds-input mt-2"
                    placeholder="Trust Education - March operational export"
                    value={uploadName}
                    onChange={(event) => setUploadName(event.target.value)}
                  />
                </div>

                <div className="rounded-[1.25rem] border border-slate-200 bg-white p-4 text-sm text-slate-600">
                  <p className="font-semibold text-slate-900">What the engine does automatically</p>
                  <ul className="mt-3 space-y-2 leading-6">
                    <li>Detects leads, students, revenue, and pipeline-style fields.</li>
                    <li>Normalizes dates, currency, phone, and email values.</li>
                    <li>Removes duplicate rows and flags quality issues.</li>
                    <li>Builds a white-labeled intelligence report instantly.</li>
                  </ul>
                </div>

                <button
                  className="ds-button-primary w-full"
                  onClick={handleUpload}
                  type="button"
                  disabled={!uploadFile || isUploading}
                >
                  <Wand2 className="h-4 w-4" />
                  {isUploading ? 'Analyzing upload...' : 'Upload and analyze'}
                </button>
              </div>
            </div>
          </SectionCard>

          <SectionCard>
            <SectionHeader
              eyebrow="Datasets"
              title="Recent intelligence uploads"
              description="Choose a dataset to inspect the cleaned rows, field mapping, and generated report."
            />

            <FilterToolbar className="mt-6">
              <label className="ds-field md:col-span-2">
                <span className="ds-label">Search datasets</span>
                <div className="relative mt-2">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    className="ds-input pl-10"
                    placeholder="Search by file, dataset name, or type"
                    value={datasetSearch}
                    onChange={(event) => setDatasetSearch(event.target.value)}
                  />
                </div>
              </label>
            </FilterToolbar>

            <div className="mt-6 space-y-3">
              {filteredDatasets.length ? (
                filteredDatasets.map((dataset) => (
                  <button
                    key={dataset._id}
                    type="button"
                    onClick={() => setSelectedDatasetId(dataset._id)}
                    className={`w-full rounded-[1.35rem] border p-4 text-left transition ${
                      selectedDatasetId === dataset._id
                        ? 'border-teal-500 bg-teal-50 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900">{dataset.name}</p>
                        <p className="mt-1 text-sm text-slate-500">{dataset.originalFileName}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {(dataset.datasetTypes || []).map((type) => (
                            <StatusPill key={type} tone="pending">
                              {DATASET_TYPE_LABELS[type] || type}
                            </StatusPill>
                          ))}
                          <StatusPill tone="completed">{dataset.cleanedRowCount || 0} rows</StatusPill>
                        </div>
                      </div>
                      <div className="text-right text-xs text-slate-500">
                        <p>{dataset.sourceType?.toUpperCase()}</p>
                        <p className="mt-2">{formatBytes(dataset.fileSize || 0)}</p>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <EmptyState
                  title="No datasets found"
                  description="Upload the first company export to start mapping fields and generating intelligence."
                  icon={BrainCircuit}
                />
              )}
            </div>
          </SectionCard>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <DataTableSurface>
            <SectionHeader
              eyebrow="Data Table Viewer"
              title="Cleaned preview"
              description="Preview rows after schema detection, normalization, duplicate removal, and field inference."
            />
            {selectedDataset?.previewRows?.length ? (
              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-slate-200 text-xs uppercase tracking-[0.2em] text-slate-500">
                    <tr>
                      {selectedDataset.previewColumns.map((column) => (
                        <th key={column} className="pb-3 pr-4 font-semibold">
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedDataset.previewRows.map((row, index) => (
                      <tr key={`preview-${index}`}>
                        {selectedDataset.previewColumns.map((column) => (
                          <td key={`${index}-${column}`} className="py-3 pr-4 align-top text-slate-700">
                            {row[column] ?? '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="mt-6">
                <EmptyState
                  title="No data preview available"
                  description="Select an analyzed dataset to inspect the cleaned preview table."
                  icon={FileText}
                />
              </div>
            )}
          </DataTableSurface>

          <SectionCard>
            <SectionHeader
              eyebrow="Field Mapping"
              title="Automatic schema detection"
              description="The engine maps uploaded columns into operational CRM concepts and marks lower-confidence inferences."
            />
            {selectedDataset?.detectedSchema?.length ? (
              <div className="mt-6 space-y-3">
                {selectedDataset.detectedSchema.map((mapping) => (
                  <article
                    key={`${mapping.sourceField}-${mapping.mappedField || mapping.normalizedField}`}
                    className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{mapping.sourceField}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          {mapping.mappedField || mapping.normalizedField} · {mapping.inferredType}
                        </p>
                      </div>
                      <StatusPill tone={mapping.confidence >= 0.8 ? 'completed' : 'pending'}>
                        {Math.round((mapping.confidence || 0) * 100)}% confidence
                      </StatusPill>
                    </div>
                    <p className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-400">
                      Coverage {mapping.coverage || 0}% · Examples: {(mapping.examples || []).slice(0, 3).join(', ') || 'n/a'}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-6">
                <EmptyState
                  title="No field mapping yet"
                  description="Upload a dataset to inspect the auto-detected schema and inferred business fields."
                  icon={Sparkles}
                />
              </div>
            )}
          </SectionCard>
        </div>

        <IntelligenceReportView
          report={selectedReport}
          companyName={selectedReport?.branding?.companyName}
          shareUrl={selectedReport?.shareUrl}
          showActions
          actions={
            <>
              <button className="ds-button" onClick={handleDownloadPdf} type="button" disabled={!selectedReport}>
                <Download className="h-4 w-4" />
                Download PDF
              </button>
              <button className="ds-button" onClick={handleCopyShareLink} type="button" disabled={!selectedReport}>
                <Sparkles className="h-4 w-4" />
                Copy share link
              </button>
              {selectedReport?._id ? (
                <Link className="ds-button-primary" href={`/intelligence/reports/${selectedReport._id}`}>
                  Open full report
                </Link>
              ) : null}
            </>
          }
        />

        <SectionCard>
          <SectionHeader
            eyebrow="Reports"
            title="Published white-label reports"
            description="Every analyzed dataset can generate a branded client report with PDF export and shareable access."
          />
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-[0.2em] text-slate-500">
                <tr>
                  <th className="pb-3 pr-4">Report</th>
                  <th className="pb-3 pr-4">Dataset</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 pr-4">Share</th>
                  <th className="pb-3 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.length ? (
                  reports.map((report) => (
                    <tr key={report._id}>
                      <td className="py-4 pr-4">
                        <p className="font-semibold text-slate-900">{report.title}</p>
                        <p className="mt-1 text-xs text-slate-500">{report.createdAt ? new Date(report.createdAt).toLocaleString() : '—'}</p>
                      </td>
                      <td className="py-4 pr-4 text-slate-600">{report.metrics?.totalRecords || 0} records</td>
                      <td className="py-4 pr-4">
                        <StatusPill tone={report.status === 'published' ? 'completed' : 'pending'}>
                          {report.status || 'draft'}
                        </StatusPill>
                      </td>
                      <td className="py-4 pr-4 text-slate-600">
                        {report.shareEnabled ? 'Enabled' : 'Disabled'}
                      </td>
                      <td className="py-4 pr-4">
                        <Link className="text-sm font-semibold text-teal-700 hover:text-teal-800" href={`/intelligence/reports/${report._id}`}>
                          View report
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-10">
                      <EmptyState
                        title="No reports yet"
                        description="Generate the first report from an uploaded dataset to enable branded exports and share links."
                        icon={FileText}
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}

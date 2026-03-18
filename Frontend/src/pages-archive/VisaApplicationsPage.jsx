import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  RefreshCw,
  Globe,
  ChevronLeft,
  ChevronRight,
  Eye,
  Trash2,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { visaAPI } from '../services/api';
import { useBranding } from '../context/BrandingContext';

const STAGE_LABELS = {
  not_started: 'Not Started',
  checklist_generated: 'Checklist Generated',
  documents_collecting: 'Collecting Docs',
  documents_ready: 'Docs Ready',
  financial_review: 'Financial Review',
  forms_completed: 'Forms Done',
  appointment_booked: 'Appt. Booked',
  biometrics_scheduled: 'Biometrics Sched.',
  biometrics_done: 'Biometrics Done',
  interview_scheduled: 'Interview Sched.',
  interview_done: 'Interview Done',
  submitted: 'Submitted',
  under_processing: 'Processing',
  additional_docs_requested: 'Additional Docs',
  approved: 'Approved ✓',
  rejected: 'Rejected ✗',
  appeal_in_progress: 'Appeal Filed',
  pre_departure_ready: 'Pre-departure',
  completed: 'Completed',
};

const STAGE_COLORS = {
  not_started: 'bg-gray-100 text-gray-600',
  checklist_generated: 'bg-sky-100 text-sky-700',
  documents_collecting: 'bg-blue-100 text-blue-700',
  documents_ready: 'bg-cyan-100 text-cyan-700',
  financial_review: 'bg-amber-100 text-amber-700',
  forms_completed: 'bg-violet-100 text-violet-700',
  appointment_booked: 'bg-purple-100 text-purple-700',
  biometrics_scheduled: 'bg-indigo-100 text-indigo-700',
  biometrics_done: 'bg-blue-100 text-blue-700',
  interview_scheduled: 'bg-orange-100 text-orange-700',
  interview_done: 'bg-amber-100 text-amber-700',
  submitted: 'bg-teal-100 text-teal-700',
  under_processing: 'bg-blue-100 text-blue-700',
  additional_docs_requested: 'bg-red-100 text-red-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  appeal_in_progress: 'bg-orange-100 text-orange-700',
  pre_departure_ready: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-green-100 text-green-700',
};

const COUNTRY_FLAGS = {
  UK: '🇬🇧',
  US: '🇺🇸',
  CA: '🇨🇦',
  AU: '🇦🇺',
  DE: '🇩🇪',
  IE: '🇮🇪',
  NZ: '🇳🇿',
};

const VisaApplicationsPage = () => {
  const { branding } = useBranding();
  const navigate = useNavigate();
  const primary = branding?.primaryColor || '#6366f1';

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [filters, setFilters] = useState({
    search: '',
    currentStage: '',
    destinationCountryCode: '',
  });
  const [dashboard, setDashboard] = useState(null);

  const fetchApplications = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = { page, limit: 20 };
        if (filters.search) params.search = filters.search;
        if (filters.currentStage) params.currentStage = filters.currentStage;
        if (filters.destinationCountryCode)
          params.destinationCountryCode = filters.destinationCountryCode;

        const [appRes, dashRes] = await Promise.all([
          visaAPI.getAll(params),
          visaAPI.getDashboard().catch(() => ({ data: { data: {} } })),
        ]);

        setApplications(appRes.data.data.applications || []);
        setPagination(appRes.data.data.pagination || {});
        setDashboard(dashRes.data.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const StatCard = ({ label, value, color, icon: Icon }) => (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
      <div
        className="p-2.5 rounded-xl"
        style={{ backgroundColor: `${color}18`, color }}
      >
        <Icon size={18} />
      </div>
      <div>
        <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">
          {label}
        </p>
        <p className="text-lg font-black text-gray-800">{value ?? '—'}</p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full gap-4 p-1">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-800">
            Visa Applications
          </h1>
          <p className="text-xs text-gray-400 font-medium mt-0.5">
            {pagination.total} applications total
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/admin/visa/rules')}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-bold text-gray-600 flex items-center gap-1.5 transition-all"
          >
            <Globe size={14} /> Visa Rules
          </button>
          <button
            onClick={() => navigate('/admin/visa/create')}
            className="px-5 py-2 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:opacity-90 shadow-lg"
            style={{ backgroundColor: primary }}
          >
            <Plus size={14} /> New Application
          </button>
        </div>
      </div>

      {/* Stats Row */}
      {dashboard && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="Total"
            value={dashboard.totalApplications}
            color="#6366f1"
            icon={Globe}
          />
          <StatCard
            label="Approved"
            value={dashboard.approvedCount}
            color="#22c55e"
            icon={CheckCircle}
          />
          <StatCard
            label="Rejected"
            value={dashboard.rejectedCount}
            color="#ef4444"
            icon={AlertCircle}
          />
          <StatCard
            label="Approval Rate"
            value={`${dashboard.approvalRate}%`}
            color="#f59e0b"
            icon={TrendingUp}
          />
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 flex-1 min-w-48">
            <Search size={14} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search applications..."
              value={filters.search}
              onChange={(e) =>
                setFilters((f) => ({ ...f, search: e.target.value }))
              }
              onKeyDown={(e) => e.key === 'Enter' && fetchApplications()}
              className="bg-transparent text-sm outline-none w-full"
            />
          </div>
          <select
            value={filters.destinationCountryCode}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                destinationCountryCode: e.target.value,
              }))
            }
            className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
          >
            <option value="">All Countries</option>
            {Object.entries(COUNTRY_FLAGS).map(([code, flag]) => (
              <option key={code} value={code}>
                {flag} {code}
              </option>
            ))}
          </select>
          <select
            value={filters.currentStage}
            onChange={(e) =>
              setFilters((f) => ({ ...f, currentStage: e.target.value }))
            }
            className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
          >
            <option value="">All Stages</option>
            {Object.entries(STAGE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              setFilters({
                search: '',
                currentStage: '',
                destinationCountryCode: '',
              });
            }}
            className="px-3 py-2 text-gray-500 hover:text-gray-700 rounded-xl bg-gray-50 border border-gray-200 text-xs font-semibold flex items-center gap-1"
          >
            <RefreshCw size={12} /> Reset
          </button>
          <button
            onClick={() => fetchApplications()}
            className="px-4 py-2 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:opacity-90"
            style={{ backgroundColor: primary }}
          >
            <Filter size={12} /> Filter
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex-1 overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div
                className="w-8 h-8 border-4 border-gray-200 rounded-full animate-spin"
                style={{ borderTopColor: primary }}
              />
            </div>
          ) : applications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-300">
              <Globe size={48} className="mb-3 opacity-30" />
              <p className="font-bold text-sm">No visa applications yet</p>
              <button
                onClick={() => navigate('/admin/visa/create')}
                className="mt-4 px-4 py-2 text-white rounded-xl text-xs font-bold hover:opacity-90"
                style={{ backgroundColor: primary }}
              >
                + Create First Application
              </button>
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead>
                <tr
                  className="text-white text-[10px] font-black uppercase tracking-widest"
                  style={{ backgroundColor: primary }}
                >
                  <th className="px-4 py-3">Visa ID</th>
                  <th className="px-4 py-3">Applicant</th>
                  <th className="px-4 py-3">Country</th>
                  <th className="px-4 py-3">University</th>
                  <th className="px-4 py-3">Stage</th>
                  <th className="px-4 py-3">Checklist</th>
                  <th className="px-4 py-3">Risk</th>
                  <th className="px-4 py-3">Counsellor</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {applications.map((app) => {
                  const flag =
                    COUNTRY_FLAGS[app.destinationCountryCode] || '🌍';
                  const checklist = app.generatedChecklist || [];
                  const done = checklist.filter(
                    (i) => i.status === 'verified'
                  ).length;
                  const completionRate =
                    checklist.length > 0
                      ? Math.round((done / checklist.length) * 100)
                      : 0;
                  const risk = app.riskAssessment;

                  return (
                    <tr
                      key={app._id}
                      className="hover:bg-gray-50/60 transition-colors group"
                    >
                      <td className="px-4 py-3">
                        <span className="font-black text-indigo-600 text-[11px]">
                          {app.visaId}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs font-bold text-gray-800">
                          {app.lead?.firstName ||
                            app.applicantSnapshot?.firstName ||
                            '—'}{' '}
                          {app.lead?.lastName ||
                            app.applicantSnapshot?.lastName ||
                            ''}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          {app.lead?.email ||
                            app.applicantSnapshot?.email ||
                            ''}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-lg">{flag}</span>
                          <span className="text-xs font-bold text-gray-700">
                            {app.destinationCountryCode}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-gray-600 max-w-32 truncate">
                          {app.universityName || '—'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STAGE_COLORS[app.currentStage] || 'bg-gray-100 text-gray-600'}`}
                        >
                          {STAGE_LABELS[app.currentStage] || app.currentStage}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${completionRate}%`,
                                backgroundColor:
                                  completionRate === 100 ? '#22c55e' : primary,
                              }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-gray-500">
                            {completionRate}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {risk?.riskCategory ? (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              risk.riskCategory === 'low'
                                ? 'bg-green-100 text-green-700'
                                : risk.riskCategory === 'medium'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {risk.riskCategory} ({risk.visaSuccessProbability}%)
                          </span>
                        ) : (
                          <span className="text-gray-300 text-[10px]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-[11px] text-gray-700">
                          {app.counsellor?.name || '—'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-[10px] text-gray-400">
                          {new Date(app.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => navigate(`/admin/visa/${app._id}`)}
                            className="p-1.5 hover:bg-indigo-50 rounded-lg text-indigo-500"
                            title="View"
                          >
                            <Eye size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {pagination.pages > 1 && (
          <div className="border-t border-gray-50 px-6 py-3 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              Showing {applications.length} of {pagination.total}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchApplications(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 disabled:opacity-30"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs font-bold text-gray-700">
                {pagination.page} / {pagination.pages}
              </span>
              <button
                onClick={() => fetchApplications(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 disabled:opacity-30"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VisaApplicationsPage;

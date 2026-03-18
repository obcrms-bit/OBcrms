import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  RefreshCw,
  Phone,
  Mail,
  User,
  Star,
  ArrowRight,
  Calendar,
  Trash2,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Flame,
  Thermometer,
  Snowflake,
  Eye,
} from 'lucide-react';
import { leadAPI } from '../services/api';
import { useBranding } from '../context/BrandingContext';

// ─── Constants ─────────────────────────────────────────────────────────────────
const STAGES = [
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
const SOURCES = [
  'website',
  'facebook',
  'instagram',
  'walk-in',
  'referral',
  'tiktok',
  'youtube',
  'event',
  'other',
];
const STAGE_COLORS = {
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
  lost: 'bg-red-100 text-red-700',
};

// ─── Sub-components ────────────────────────────────────────────────────────────
const ScoreBadge = ({ score, category }) => {
  const conf = {
    hot: { icon: Flame, color: 'text-red-500', bg: 'bg-red-50', label: 'Hot' },
    warm: {
      icon: Thermometer,
      color: 'text-amber-500',
      bg: 'bg-amber-50',
      label: 'Warm',
    },
    cold: {
      icon: Snowflake,
      color: 'text-blue-400',
      bg: 'bg-blue-50',
      label: 'Cold',
    },
  };
  const { icon: Icon, color, bg, label } = conf[category] || conf.cold;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${bg} ${color}`}
    >
      <Icon size={10} /> {score} {label}
    </span>
  );
};

const StatusBadge = ({ status }) => (
  <span
    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STAGE_COLORS[status] || 'bg-gray-100 text-gray-600'}`}
  >
    {STAGES.find((s) => s.key === status)?.label || status}
  </span>
);

// ─── Main Component ─────────────────────────────────────────────────────────
const LeadsPage = () => {
  const { branding } = useBranding();
  const navigate = useNavigate();

  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pages: 1,
    limit: 20,
  });
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    source: '',
    category: '',
  });
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [deleteId, setDeleteId] = useState(null);

  const fetchLeads = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = { page, limit: 20 };
        if (filters.search) params.search = filters.search;
        if (filters.status) params.status = filters.status;
        if (filters.source) params.source = filters.source;
        if (filters.category) params.category = filters.category;
        const res = await leadAPI.getLeads(params);
        setLeads(res.data.data.leads || []);
        setPagination(
          res.data.data.pagination || { total: 0, page: 1, pages: 1 }
        );
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleDelete = async (id) => {
    try {
      await leadAPI.deleteLead(id);
      setDeleteId(null);
      fetchLeads();
    } catch (e) {
      console.error(e);
    }
  };

  const toggleSelect = (id) => {
    setSelectedLeads((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const primaryColor = branding?.primaryColor || '#6366f1';

  return (
    <div className="flex flex-col h-full gap-4 p-1">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-800">Leads</h1>
          <p className="text-xs text-gray-400 font-medium mt-0.5">
            {pagination.total} leads total
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/admin/leads/pipeline')}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-bold text-gray-600 flex items-center gap-1.5 transition-all"
          >
            <TrendingUp size={14} /> Pipeline
          </button>
          <button
            onClick={() => navigate('/admin/leads/create')}
            className="px-5 py-2 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg transition-all hover:opacity-90 active:scale-95"
            style={{ backgroundColor: primaryColor }}
          >
            <Plus size={14} /> Add Lead
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 flex-1 min-w-48">
            <Search size={14} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search leads..."
              value={filters.search}
              onChange={(e) =>
                setFilters((f) => ({ ...f, search: e.target.value }))
              }
              className="bg-transparent text-sm outline-none w-full"
              onKeyDown={(e) => e.key === 'Enter' && fetchLeads()}
            />
          </div>
          <select
            value={filters.status}
            onChange={(e) =>
              setFilters((f) => ({ ...f, status: e.target.value }))
            }
            className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
          >
            <option value="">All Statuses</option>
            {STAGES.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
          <select
            value={filters.source}
            onChange={(e) =>
              setFilters((f) => ({ ...f, source: e.target.value }))
            }
            className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
          >
            <option value="">All Sources</option>
            {SOURCES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
          <select
            value={filters.category}
            onChange={(e) =>
              setFilters((f) => ({ ...f, category: e.target.value }))
            }
            className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
          >
            <option value="">All Categories</option>
            <option value="hot">🔥 Hot</option>
            <option value="warm">🌡️ Warm</option>
            <option value="cold">❄️ Cold</option>
          </select>
          <button
            onClick={() => {
              setFilters({ search: '', status: '', source: '', category: '' });
            }}
            className="px-3 py-2 text-gray-500 hover:text-gray-700 rounded-xl bg-gray-50 border border-gray-200 text-xs font-semibold flex items-center gap-1"
          >
            <RefreshCw size={12} /> Reset
          </button>
          <button
            onClick={() => fetchLeads()}
            className="px-4 py-2 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:opacity-90"
            style={{ backgroundColor: primaryColor }}
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
                style={{ borderTopColor: primaryColor }}
              />
            </div>
          ) : leads.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-300">
              <User size={48} className="mb-3 opacity-30" />
              <p className="font-bold text-sm">No leads found</p>
              <button
                onClick={() => navigate('/admin/leads/create')}
                className="mt-4 px-4 py-2 text-white rounded-xl text-xs font-bold hover:opacity-90"
                style={{ backgroundColor: primaryColor }}
              >
                + Add Your First Lead
              </button>
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead>
                <tr
                  className="text-white text-[10px] font-black uppercase tracking-widest"
                  style={{ backgroundColor: primaryColor }}
                >
                  <th className="px-4 py-3 w-8">
                    <input
                      type="checkbox"
                      className="rounded"
                      onChange={(e) =>
                        setSelectedLeads(
                          e.target.checked ? leads.map((l) => l._id) : []
                        )
                      }
                    />
                  </th>
                  <th className="px-4 py-3">Lead</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Countries</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Counsellor</th>
                  <th className="px-4 py-3">Follow-up</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {leads.map((lead) => (
                  <tr
                    key={lead._id}
                    className="hover:bg-gray-50/60 transition-colors group"
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={selectedLeads.includes(lead._id)}
                        onChange={() => toggleSelect(lead._id)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-black"
                          style={{ backgroundColor: primaryColor }}
                        >
                          {(lead.firstName ||
                            lead.name ||
                            '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <div
                            className="font-bold text-gray-800 text-xs hover:underline cursor-pointer"
                            onClick={() => navigate(`/admin/leads/${lead._id}`)}
                          >
                            {lead.firstName} {lead.lastName}
                          </div>
                          <div className="text-[10px] text-gray-400">
                            {lead.email || '—'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-[11px] text-gray-600">
                        <Phone size={10} className="text-gray-400" />{' '}
                        {lead.phone}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-bold capitalize">
                        {lead.source}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-[11px] text-gray-600">
                        {lead.preferredCountries?.join(', ') ||
                          lead.interestedCountry ||
                          '—'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={lead.status} />
                    </td>
                    <td className="px-4 py-3">
                      <ScoreBadge
                        score={lead.leadScore || 0}
                        category={lead.leadCategory || 'cold'}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-[11px] text-gray-700 font-medium">
                        {lead.assignedCounsellor?.name || '—'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {lead.nextFollowUp ? (
                        <div className="flex items-center gap-1 text-[10px]">
                          <Calendar size={10} className="text-orange-400" />
                          <span
                            className={
                              new Date(lead.nextFollowUp) < new Date()
                                ? 'text-red-500 font-bold'
                                : 'text-gray-600'
                            }
                          >
                            {new Date(lead.nextFollowUp).toLocaleDateString()}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-300 text-[10px]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => navigate(`/admin/leads/${lead._id}`)}
                          className="p-1.5 hover:bg-indigo-50 rounded-lg text-indigo-500 transition-colors"
                          title="View"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteId(lead._id)}
                          className="p-1.5 hover:bg-red-50 rounded-lg text-red-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="border-t border-gray-50 px-6 py-3 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              Showing {leads.length} of {pagination.total} leads
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchLeads(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs font-bold text-gray-700">
                {pagination.page} / {pagination.pages}
              </span>
              <button
                onClick={() => fetchLeads(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirm Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-sm w-full mx-4">
            <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 size={28} className="text-red-500" />
            </div>
            <h3 className="text-lg font-black text-center text-gray-800 mb-2">
              Delete Lead?
            </h3>
            <p className="text-xs text-center text-gray-500 mb-6">
              This action will soft-delete the lead. It can be recovered from
              the database.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-xs font-bold hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadsPage;

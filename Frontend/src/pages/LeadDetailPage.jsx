import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Phone,
  Mail,
  Calendar,
  User,
  Globe,
  BookOpen,
  Star,
  TrendingUp,
  Clock,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Edit,
  UserCheck,
  RefreshCw,
  Flame,
  Thermometer,
  Snowflake,
  ChevronDown,
  Plus,
} from 'lucide-react';
import { leadAPI } from '../services/api';
import { useBranding } from '../context/BrandingContext';

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

const STAGES = [
  'new',
  'contacted',
  'qualified',
  'counselling_scheduled',
  'counselling_done',
  'application_started',
  'documents_pending',
  'application_submitted',
  'offer_received',
  'visa_applied',
  'enrolled',
  'lost',
];

const ACTIVITY_ICONS = {
  lead_created: CheckCircle,
  lead_updated: Edit,
  status_changed: TrendingUp,
  assignment_changed: UserCheck,
  followup_scheduled: Calendar,
  note_added: MessageSquare,
  converted_to_student: Star,
  communication_logged: Phone,
  score_updated: Star,
};

const LeadDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { branding } = useBranding();
  const primary = branding?.primaryColor || '#6366f1';

  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Modal states
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [showConvertConfirm, setShowConvertConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [followUpForm, setFollowUpForm] = useState({
    scheduledAt: '',
    type: 'call',
    notes: '',
  });
  const [selectedStatus, setSelectedStatus] = useState('');

  const fetchLead = async () => {
    setLoading(true);
    try {
      const res = await leadAPI.getLeadById(id);
      setLead(res.data.data.lead);
      setSelectedStatus(res.data.data.lead.status);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLead();
  }, [id]);

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setActionLoading(true);
    try {
      await leadAPI.addNote(id, newNote);
      setNewNote('');
      setShowNote(false);
      fetchLead();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleFollowUp = async () => {
    if (!followUpForm.scheduledAt) return;
    setActionLoading(true);
    try {
      await leadAPI.scheduleFollowUp(id, followUpForm);
      setShowFollowUp(false);
      fetchLead();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async () => {
    setActionLoading(true);
    try {
      await leadAPI.updateStatus(id, selectedStatus);
      setShowStatus(false);
      fetchLead();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConvert = async () => {
    setActionLoading(true);
    try {
      await leadAPI.convertToStudent(id);
      setShowConvertConfirm(false);
      fetchLead();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecalcScore = async () => {
    setActionLoading(true);
    try {
      await leadAPI.recalculateScore(id);
      fetchLead();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-full">
        <div
          className="w-10 h-10 border-4 border-gray-200 rounded-full animate-spin"
          style={{ borderTopColor: primary }}
        />
      </div>
    );
  if (!lead)
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
        <AlertCircle size={48} className="mb-4 opacity-30" />
        <p>Lead not found</p>
      </div>
    );

  const ScoreBadge = ({ s, c }) => {
    const conf = {
      hot: { icon: Flame, bg: 'bg-red-50', text: 'text-red-500' },
      warm: { icon: Thermometer, bg: 'bg-amber-50', text: 'text-amber-500' },
      cold: { icon: Snowflake, bg: 'bg-blue-50', text: 'text-blue-400' },
    };
    const { icon: Icon, bg, text } = conf[c] || conf.cold;
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${bg} ${text} font-bold text-sm`}
      >
        <Icon size={14} /> {s}/100 — {c?.toUpperCase()}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/leads')}
            className="p-2 hover:bg-gray-100 rounded-xl transition-all"
          >
            <ArrowLeft size={18} className="text-gray-500" />
          </button>
          <div>
            <h1 className="text-xl font-black text-gray-800">
              {lead.firstName} {lead.lastName}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STAGE_COLORS[lead.status] || 'bg-gray-100 text-gray-600'}`}
              >
                {lead.status?.replace(/_/g, ' ').toUpperCase()}
              </span>
              {lead.convertedToStudent && (
                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-bold">
                  ✓ Student
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {!lead.convertedToStudent && (
            <button
              onClick={() => setShowConvertConfirm(true)}
              className="px-4 py-2 bg-green-500 text-white rounded-xl text-xs font-bold hover:bg-green-600 transition-all"
            >
              Convert to Student
            </button>
          )}
          <button
            onClick={() => setShowStatus(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white hover:opacity-90 transition-all"
            style={{ backgroundColor: primary }}
          >
            Update Stage
          </button>
        </div>
      </div>

      <div className="flex gap-4 flex-1 overflow-hidden">
        {/* Left Panel */}
        <div className="w-72 flex flex-col gap-4 overflow-y-auto flex-shrink-0">
          {/* Profile Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-black mb-4"
              style={{ backgroundColor: primary }}
            >
              {lead.firstName?.[0]?.toUpperCase()}
            </div>
            <h3 className="font-black text-gray-800">
              {lead.firstName} {lead.lastName}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5 capitalize">
              {lead.source} lead
            </p>

            <div className="mt-4 space-y-2">
              {lead.email && (
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Mail size={12} className="text-gray-400 flex-shrink-0" />
                  <span className="truncate">{lead.email}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Phone size={12} className="text-gray-400 flex-shrink-0" />
                <span>{lead.phone}</span>
              </div>
              {lead.nextFollowUp && (
                <div className="flex items-center gap-2 text-xs">
                  <Calendar
                    size={12}
                    className="text-orange-400 flex-shrink-0"
                  />
                  <span
                    className={
                      new Date(lead.nextFollowUp) < new Date()
                        ? 'text-red-500 font-bold'
                        : 'text-gray-600'
                    }
                  >
                    {new Date(lead.nextFollowUp).toLocaleDateString()} (next
                    follow-up)
                  </span>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-50">
              <ScoreBadge s={lead.leadScore} c={lead.leadCategory} />
            </div>

            <button
              onClick={handleRecalcScore}
              disabled={actionLoading}
              className="mt-2 w-full text-xs font-bold text-gray-400 hover:text-gray-600 flex items-center justify-center gap-1 py-1.5 hover:bg-gray-50 rounded-lg transition-all"
            >
              <RefreshCw size={10} /> Recalculate
            </button>
          </div>

          {/* Counsellor */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
              Assigned Counsellor
            </p>
            {lead.assignedCounsellor ? (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold">
                  {lead.assignedCounsellor.name?.[0]}
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-800">
                    {lead.assignedCounsellor.name}
                  </div>
                  <div className="text-[10px] text-gray-400">
                    {lead.assignedCounsellor.email}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">Not assigned</p>
            )}
          </div>

          {/* Study Preferences */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
              Study Preferences
            </p>
            <div className="space-y-2">
              {lead.preferredCountries?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {lead.preferredCountries.map((c) => (
                    <span
                      key={c}
                      className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[10px] font-bold"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              )}
              {lead.preferredStudyLevel && (
                <div className="text-xs text-gray-600 flex items-center gap-1">
                  <BookOpen size={10} className="text-gray-400" />
                  {lead.preferredStudyLevel?.replace(/_/g, ' ')}
                </div>
              )}
              {lead.preferredIntake && (
                <div className="text-xs text-gray-600 flex items-center gap-1">
                  <Calendar size={10} className="text-gray-400" />
                  {lead.preferredIntake}
                </div>
              )}
              {lead.budget > 0 && (
                <div className="text-xs text-gray-600">
                  Budget: NPR {lead.budget?.toLocaleString()}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-2">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
              Quick Actions
            </p>
            <button
              onClick={() => setShowFollowUp(true)}
              className="w-full py-2 text-xs font-bold rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-all flex items-center justify-center gap-1.5"
            >
              <Calendar size={12} /> Schedule Follow-up
            </button>
            <button
              onClick={() => setShowNote(true)}
              className="w-full py-2 text-xs font-bold rounded-xl bg-gray-50 text-gray-600 hover:bg-gray-100 transition-all flex items-center justify-center gap-1.5"
            >
              <MessageSquare size={12} /> Add Note
            </button>
          </div>
        </div>

        {/* Right Panel — Tabs */}
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          {/* Tab Bar */}
          <div className="flex bg-white rounded-2xl border border-gray-100 shadow-sm p-1 gap-1">
            {['overview', 'timeline', 'notes', 'followups'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold capitalize transition-all ${activeTab === tab ? 'text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
                style={activeTab === tab ? { backgroundColor: primary } : {}}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-2 gap-4">
                {/* Education */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 col-span-2">
                  <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">
                    Education
                  </h3>
                  {lead.education?.lastDegree ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        ['Degree', lead.education.lastDegree],
                        ['Institution', lead.education.institution],
                        [
                          'Percentage',
                          lead.education.percentage
                            ? `${lead.education.percentage}%`
                            : null,
                        ],
                        ['Passing Year', lead.education.passingYear],
                        ['GPA', lead.education.gpa],
                      ]
                        .filter(([, v]) => v)
                        .map(([label, value]) => (
                          <div
                            key={label}
                            className="bg-gray-50 rounded-xl p-3"
                          >
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">
                              {label}
                            </p>
                            <p className="text-sm font-bold text-gray-800 mt-1">
                              {value}
                            </p>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">
                      No education data entered
                    </p>
                  )}
                </div>

                {/* English Test */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">
                    English Proficiency
                  </h3>
                  {lead.englishTest?.type &&
                  lead.englishTest.type !== 'none' ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-black uppercase">
                          {lead.englishTest.type}
                        </span>
                        <span className="text-lg font-black text-gray-800">
                          {lead.englishTest.score}
                        </span>
                      </div>
                      {lead.englishTest.dateTaken && (
                        <p className="text-xs text-gray-400">
                          Taken:{' '}
                          {new Date(
                            lead.englishTest.dateTaken
                          ).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">
                      No test recorded
                    </p>
                  )}
                </div>

                {/* Tags */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {lead.tags?.length > 0 ? (
                      lead.tags.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-[10px] font-bold"
                        >
                          {t}
                        </span>
                      ))
                    ) : (
                      <p className="text-xs text-gray-400 italic">No tags</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Timeline Tab */}
            {activeTab === 'timeline' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">
                  Activity Timeline
                </h3>
                {lead.activities?.length === 0 ? (
                  <p className="text-xs text-gray-400 italic text-center py-8">
                    No activities yet
                  </p>
                ) : (
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-100" />
                    <div className="space-y-4">
                      {[...lead.activities].reverse().map((act, i) => {
                        const Icon = ACTIVITY_ICONS[act.type] || Clock;
                        return (
                          <div
                            key={act._id || i}
                            className="flex gap-3 relative"
                          >
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10"
                              style={{
                                backgroundColor: `${primary}20`,
                                color: primary,
                              }}
                            >
                              <Icon size={14} />
                            </div>
                            <div className="flex-1 pb-4">
                              <p className="text-xs font-bold text-gray-800">
                                {act.description}
                              </p>
                              <p className="text-[10px] text-gray-400 mt-0.5">
                                {new Date(act.createdAt).toLocaleString()}
                                {act.performedBy?.name &&
                                  ` · ${act.performedBy.name}`}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Notes Tab */}
            {activeTab === 'notes' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">
                    Notes
                  </h3>
                  <button
                    onClick={() => setShowNote(true)}
                    className="px-3 py-1.5 text-white rounded-xl text-[10px] font-bold hover:opacity-90"
                    style={{ backgroundColor: primary }}
                  >
                    + Add Note
                  </button>
                </div>
                {lead.notes?.length === 0 ? (
                  <p className="text-xs text-gray-400 italic text-center py-8">
                    No notes yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {[...lead.notes].reverse().map((note, i) => (
                      <div
                        key={note._id || i}
                        className="bg-gray-50 rounded-xl p-4"
                      >
                        <p className="text-sm text-gray-700">{note.content}</p>
                        <p className="text-[10px] text-gray-400 mt-2">
                          {new Date(note.createdAt).toLocaleString()}
                          {note.createdBy?.name && ` · ${note.createdBy.name}`}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Follow-ups Tab */}
            {activeTab === 'followups' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">
                    Follow-ups
                  </h3>
                  <button
                    onClick={() => setShowFollowUp(true)}
                    className="px-3 py-1.5 text-white rounded-xl text-[10px] font-bold hover:opacity-90"
                    style={{ backgroundColor: primary }}
                  >
                    + Schedule
                  </button>
                </div>
                {lead.followUps?.length === 0 ? (
                  <p className="text-xs text-gray-400 italic text-center py-8">
                    No follow-ups scheduled
                  </p>
                ) : (
                  <div className="space-y-3">
                    {[...lead.followUps].reverse().map((fu, i) => (
                      <div
                        key={fu._id || i}
                        className={`rounded-xl p-4 ${fu.status === 'pending' ? 'bg-amber-50 border border-amber-100' : 'bg-gray-50'}`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold capitalize text-gray-800">
                                {fu.type}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${fu.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}
                              >
                                {fu.status}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-600">
                              {new Date(fu.scheduledAt).toLocaleString()}
                            </p>
                            {fu.notes && (
                              <p className="text-[10px] text-gray-500 mt-1">
                                {fu.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Modals ─── */}
      {/* Follow-up Modal */}
      {showFollowUp && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 shadow-2xl w-full max-w-sm mx-4">
            <h3 className="text-base font-black mb-4 text-gray-800">
              Schedule Follow-up
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">
                  Date & Time *
                </label>
                <input
                  type="datetime-local"
                  value={followUpForm.scheduledAt}
                  onChange={(e) =>
                    setFollowUpForm((f) => ({
                      ...f,
                      scheduledAt: e.target.value,
                    }))
                  }
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">
                  Type
                </label>
                <select
                  value={followUpForm.type}
                  onChange={(e) =>
                    setFollowUpForm((f) => ({ ...f, type: e.target.value }))
                  }
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none"
                >
                  {['call', 'email', 'whatsapp', 'meeting', 'sms'].map((t) => (
                    <option key={t} value={t}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">
                  Notes
                </label>
                <textarea
                  value={followUpForm.notes}
                  onChange={(e) =>
                    setFollowUpForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  rows={3}
                  placeholder="Notes about this follow-up..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none resize-none"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowFollowUp(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleFollowUp}
                disabled={actionLoading}
                className="flex-1 py-2.5 text-white rounded-xl text-xs font-bold hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: primary }}
              >
                {actionLoading ? 'Saving...' : 'Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Note Modal */}
      {showNote && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 shadow-2xl w-full max-w-sm mx-4">
            <h3 className="text-base font-black mb-4 text-gray-800">
              Add Note
            </h3>
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              rows={5}
              placeholder="Enter your note..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none resize-none"
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowNote(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleAddNote}
                disabled={actionLoading || !newNote.trim()}
                className="flex-1 py-2.5 text-white rounded-xl text-xs font-bold hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: primary }}
              >
                {actionLoading ? 'Adding...' : 'Add Note'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Modal */}
      {showStatus && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 shadow-2xl w-full max-w-sm mx-4">
            <h3 className="text-base font-black mb-4 text-gray-800">
              Update Stage
            </h3>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none mb-4"
            >
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, ' ').toUpperCase()}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={() => setShowStatus(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusChange}
                disabled={actionLoading}
                className="flex-1 py-2.5 text-white rounded-xl text-xs font-bold hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: primary }}
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Convert Confirm */}
      {showConvertConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-sm w-full mx-4 text-center">
            <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Star size={28} className="text-green-500" />
            </div>
            <h3 className="text-lg font-black text-gray-800 mb-2">
              Convert to Student?
            </h3>
            <p className="text-xs text-gray-500 mb-6">
              A student profile will be created from this lead's data.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConvertConfirm(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleConvert}
                disabled={actionLoading}
                className="flex-1 py-2.5 bg-green-500 text-white rounded-xl text-xs font-bold hover:bg-green-600 disabled:opacity-50"
              >
                {actionLoading ? 'Converting...' : 'Convert'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadDetailPage;

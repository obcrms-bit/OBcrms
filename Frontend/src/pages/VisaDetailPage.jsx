import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Globe,
  CheckCircle,
  AlertCircle,
  Clock,
  FileText,
  DollarSign,
  Calendar,
  Shield,
  TrendingUp,
  ChevronRight,
  Zap,
  Download,
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
  appointment_booked: 'Appointment Booked',
  biometrics_scheduled: 'Biometrics Scheduled',
  biometrics_done: 'Biometrics Done',
  interview_scheduled: 'Interview Scheduled',
  interview_done: 'Interview Done',
  submitted: 'Submitted',
  under_processing: 'Under Processing',
  additional_docs_requested: 'Additional Docs Requested',
  approved: 'APPROVED ✓',
  rejected: 'REJECTED ✗',
  appeal_in_progress: 'Appeal In Progress',
  pre_departure_ready: 'Pre-Departure Ready',
  completed: 'Completed',
};

const STAGES_ORDERED = [
  'not_started',
  'checklist_generated',
  'documents_collecting',
  'documents_ready',
  'financial_review',
  'forms_completed',
  'appointment_booked',
  'biometrics_scheduled',
  'biometrics_done',
  'interview_scheduled',
  'interview_done',
  'submitted',
  'under_processing',
  'additional_docs_requested',
  'approved',
];

const StatusChip = ({ stage }) => {
  const isApproved = stage === 'approved';
  const isRejected = stage === 'rejected';
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-black ${isApproved ? 'bg-green-100 text-green-700' : isRejected ? 'bg-red-100 text-red-700' : 'bg-indigo-100 text-indigo-700'}`}
    >
      {STAGE_LABELS[stage] || stage}
    </span>
  );
};

const VisaDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { branding } = useBranding();
  const primary = branding?.primaryColor || '#6366f1';

  const [visa, setVisa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [actionLoading, setActionLoading] = useState('');

  // Modals
  const [showStageModal, setShowStageModal] = useState(false);
  const [showRiskModal, setShowRiskModal] = useState(false);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [showBiometricsModal, setShowBiometricsModal] = useState(false);
  const [showDecisionModal, setShowDecisionModal] = useState('');
  const [newStage, setNewStage] = useState('');
  const [interviewForm, setInterviewForm] = useState({
    scheduledDate: '',
    venue: '',
    type: 'embassy',
  });
  const [biometricsForm, setBiometricsForm] = useState({
    scheduledDate: '',
    venue: '',
  });
  const [riskForm, setRiskForm] = useState({
    academicGPA: 3.0,
    englishTestType: 'ielts',
    englishScore: 6.5,
    gapYears: 0,
    refusalCount: 0,
    hasVisaHistory: false,
  });
  const [decisionForm, setDecisionForm] = useState({
    validFrom: '',
    validTo: '',
    rejectionReason: '',
  });

  const fetchVisa = async () => {
    setLoading(true);
    try {
      const res = await visaAPI.getById(id);
      setVisa(res.data.data.visa);
      setNewStage(res.data.data.visa.currentStage);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisa();
  }, [id]);

  const action = async (key, fn) => {
    setActionLoading(key);
    try {
      await fn();
      await fetchVisa();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading('');
    }
  };

  const handleGenerateWorkflow = () =>
    action('workflow', () => visaAPI.generateWorkflow(id));
  const handleSubmitApp = () => action('submit', () => visaAPI.submit(id));
  const handleStageUpdate = () =>
    action('stage', async () => {
      await visaAPI.updateStage(id, newStage);
      setShowStageModal(false);
    });
  const handleRiskAssess = () =>
    action('risk', async () => {
      await visaAPI.runRiskAssessment(id, riskForm);
      setShowRiskModal(false);
    });
  const handleScheduleInterview = () =>
    action('interview', async () => {
      await visaAPI.scheduleInterview(id, interviewForm);
      setShowInterviewModal(false);
    });
  const handleScheduleBiometrics = () =>
    action('biometrics', async () => {
      await visaAPI.scheduleBiometrics(id, biometricsForm);
      setShowBiometricsModal(false);
    });
  const handleApprove = () =>
    action('approve', async () => {
      await visaAPI.approve(id, decisionForm);
      setShowDecisionModal('');
    });
  const handleReject = () =>
    action('reject', async () => {
      await visaAPI.reject(id, {
        rejectionReason: decisionForm.rejectionReason,
      });
      setShowDecisionModal('');
    });

  const handleVerify = (itemId) =>
    action(`verify_${itemId}`, () => visaAPI.verifyChecklistItem(id, itemId));
  const handleRejectDoc = (itemId) =>
    action(`reject_${itemId}`, () =>
      visaAPI.rejectChecklistItem(id, itemId, 'Rejected by counsellor')
    );

  if (loading)
    return (
      <div className="flex items-center justify-center h-full">
        <div
          className="w-10 h-10 border-4 border-gray-200 rounded-full animate-spin"
          style={{ borderTopColor: primary }}
        />
      </div>
    );
  if (!visa)
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-300">
        <Globe size={48} className="mb-4 opacity-30" />
        <p>Visa application not found</p>
      </div>
    );

  const checklist = visa.generatedChecklist || [];
  const verified = checklist.filter((i) => i.status === 'verified').length;
  const completion =
    checklist.length > 0 ? Math.round((verified / checklist.length) * 100) : 0;
  const risk = visa.riskAssessment;
  const fa = visa.financialAssessment;

  const currentStageIdx = STAGES_ORDERED.indexOf(visa.currentStage);

  const TABS = [
    'overview',
    'checklist',
    'financial',
    'interview',
    'timeline',
    'risk',
  ];

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <button
            onClick={() => navigate('/admin/visa')}
            className="p-2 hover:bg-gray-100 rounded-xl mt-0.5"
          >
            <ArrowLeft size={18} className="text-gray-500" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{visa.flagEmoji || '🌍'}</span>
              <h1 className="text-xl font-black text-gray-800">
                {visa.visaId} — {visa.destinationCountry}
              </h1>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <StatusChip stage={visa.currentStage} />
              {visa.universityName && (
                <span className="text-xs text-gray-500">
                  {visa.universityName}
                </span>
              )}
              <span className="text-xs text-gray-400">
                {visa.applicantSnapshot?.firstName}{' '}
                {visa.applicantSnapshot?.lastName}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {visa.currentStage === 'not_started' && (
            <button
              onClick={handleGenerateWorkflow}
              disabled={!!actionLoading}
              className="px-4 py-2 bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-indigo-600 disabled:opacity-50"
            >
              <Zap size={12} /> Generate Workflow
            </button>
          )}
          <button
            onClick={() => setShowStageModal(true)}
            className="px-4 py-2 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:opacity-90"
            style={{ backgroundColor: primary }}
          >
            Update Stage
          </button>
          <div className="flex gap-1">
            <button
              onClick={() => {
                setDecisionForm({ validFrom: '', validTo: '' });
                setShowDecisionModal('approve');
              }}
              className="px-3 py-2 bg-green-500 text-white rounded-xl text-xs font-bold hover:bg-green-600"
            >
              ✓ Approve
            </button>
            <button
              onClick={() => {
                setDecisionForm({ rejectionReason: '' });
                setShowDecisionModal('reject');
              }}
              className="px-3 py-2 bg-red-500 text-white rounded-xl text-xs font-bold hover:bg-red-600"
            >
              ✗ Reject
            </button>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-black text-gray-600">
            Checklist Progress
          </span>
          <span className="text-xs font-black" style={{ color: primary }}>
            {completion}% complete ({verified}/{checklist.length})
          </span>
        </div>
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${completion}%`,
              backgroundColor: completion === 100 ? '#22c55e' : primary,
            }}
          />
        </div>
        {risk?.visaSuccessProbability !== undefined && (
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-50">
            <span className="text-xs text-gray-500">
              Visa Success Probability:
            </span>
            <span
              className={`text-sm font-black ${risk.visaSuccessProbability >= 70 ? 'text-green-600' : risk.visaSuccessProbability >= 50 ? 'text-amber-600' : 'text-red-600'}`}
            >
              {risk.visaSuccessProbability}%
            </span>
            <span
              className={`text-[10px] font-black px-2 py-0.5 rounded-full ${risk.riskCategory === 'low' ? 'bg-green-100 text-green-700' : risk.riskCategory === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}
            >
              {risk.riskCategory?.toUpperCase()} RISK
            </span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex bg-white rounded-2xl border border-gray-100 shadow-sm p-1 gap-1">
        {TABS.map((tab) => (
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

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {/* ── Overview ─────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Applicant */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">
                Applicant
              </h3>
              <div className="space-y-2">
                {[
                  [
                    'Name',
                    `${visa.applicantSnapshot?.firstName || ''} ${visa.applicantSnapshot?.lastName || ''}`,
                  ],
                  ['Email', visa.applicantSnapshot?.email],
                  ['Phone', visa.applicantSnapshot?.phone],
                  ['Nationality', visa.applicantSnapshot?.nationality],
                  ['Passport', visa.applicantSnapshot?.passportNumber],
                  [
                    'Passport Expiry',
                    visa.applicantSnapshot?.passportExpiry
                      ? new Date(
                          visa.applicantSnapshot.passportExpiry
                        ).toLocaleDateString()
                      : null,
                  ],
                ]
                  .filter(([, v]) => v)
                  .map(([label, value]) => (
                    <div key={label} className="flex justify-between text-xs">
                      <span className="text-gray-400 font-bold">{label}</span>
                      <span className="text-gray-800 font-bold">{value}</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Course */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">
                Course Details
              </h3>
              <div className="space-y-2">
                {[
                  ['University', visa.universityName],
                  ['Course', visa.courseName],
                  ['Level', visa.studyLevel],
                  ['Duration', visa.courseDuration],
                  [
                    'Intake',
                    visa.intakeDate
                      ? new Date(visa.intakeDate).toLocaleDateString()
                      : null,
                  ],
                  [
                    'Start Date',
                    visa.courseStartDate
                      ? new Date(visa.courseStartDate).toLocaleDateString()
                      : null,
                  ],
                ]
                  .filter(([, v]) => v)
                  .map(([label, value]) => (
                    <div key={label} className="flex justify-between text-xs">
                      <span className="text-gray-400 font-bold">{label}</span>
                      <span className="text-gray-800 font-bold">{value}</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Visa Rule Snapshot */}
            {visa.ruleSnapshot && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">
                  Visa Requirements
                </h3>
                <div className="space-y-1.5">
                  {[
                    [
                      'Biometrics',
                      visa.ruleSnapshot.biometricRequired
                        ? '✓ Required'
                        : '✗ Not required',
                    ],
                    [
                      'Interview',
                      visa.ruleSnapshot.interviewRequired
                        ? '✓ Required'
                        : '✗ Not required',
                    ],
                    [
                      'Medical',
                      visa.ruleSnapshot.medicalRequired
                        ? '✓ Required'
                        : '✗ Not required',
                    ],
                    [
                      'Processing',
                      `${visa.ruleSnapshot.processingTimeWeeksMin}-${visa.ruleSnapshot.processingTimeWeeksMax} weeks`,
                    ],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between text-xs">
                      <span className="text-gray-400 font-bold">{label}</span>
                      <span
                        className={`font-bold ${value.startsWith('✓') ? 'text-indigo-600' : 'text-gray-500'}`}
                      >
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payment */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">
                Payment
              </h3>
              <div className="space-y-1.5">
                {[
                  [
                    'Visa Fee',
                    visa.payment?.visaFeeAmount
                      ? `${visa.payment.visaFeeAmount} ${visa.payment.visaFeeCurrency}`
                      : '—',
                  ],
                  [
                    'Surcharge / IHS',
                    visa.payment?.surchargeAmount
                      ? `${visa.payment.surchargeAmount}`
                      : '—',
                  ],
                  [
                    'SEVIS Fee',
                    visa.payment?.sevisFeeAmount
                      ? `${visa.payment.sevisFeeAmount} USD`
                      : '—',
                  ],
                  [
                    'Visa Fee Paid',
                    visa.payment?.visaFeePaid ? '✓ Yes' : '✗ No',
                  ],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between text-xs">
                    <span className="text-gray-400 font-bold">{label}</span>
                    <span className="font-bold text-gray-800">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Deadlines */}
            {visa.deadlines?.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:col-span-2">
                <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">
                  ⏰ Deadlines
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {visa.deadlines.map((d, i) => {
                    const isOverdue = new Date(d.date) < new Date();
                    return (
                      <div
                        key={i}
                        className={`rounded-xl p-3 ${isOverdue ? 'bg-red-50 border border-red-100' : 'bg-amber-50 border border-amber-100'}`}
                      >
                        <p className="text-[10px] font-black text-gray-500 uppercase">
                          {d.type?.replace(/_/g, ' ')}
                        </p>
                        <p className="text-xs font-bold text-gray-800 mt-0.5">
                          {d.label}
                        </p>
                        <p
                          className={`text-[10px] font-bold mt-1 ${isOverdue ? 'text-red-600' : 'text-amber-600'}`}
                        >
                          {new Date(d.date).toLocaleDateString()}{' '}
                          {isOverdue && '⚠ OVERDUE'}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Checklist ─────────────────────────────────────────── */}
        {activeTab === 'checklist' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-black text-gray-700">
                Document Checklist
              </h3>
              <span className="text-xs font-bold text-gray-400">
                {verified}/{checklist.length} verified
              </span>
            </div>
            {checklist.length === 0 ? (
              <div className="text-center py-12 text-gray-300">
                <FileText size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm font-bold mb-2">No checklist generated</p>
                <button
                  onClick={handleGenerateWorkflow}
                  disabled={!!actionLoading}
                  className="px-4 py-2 text-white rounded-xl text-xs font-bold hover:opacity-90"
                  style={{ backgroundColor: primary }}
                >
                  <Zap size={12} className="inline mr-1" /> Generate Workflow
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {checklist.map((item) => (
                  <div
                    key={item._id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${item.status === 'verified' ? 'bg-green-50 border-green-100' : item.status === 'rejected' ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex-shrink-0">
                        {item.status === 'verified' ? (
                          <CheckCircle size={18} className="text-green-500" />
                        ) : item.status === 'rejected' ? (
                          <AlertCircle size={18} className="text-red-400" />
                        ) : (
                          <div className="w-[18px] h-[18px] rounded-full border-2 border-gray-300" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p
                          className={`text-xs font-bold truncate ${item.status === 'verified' ? 'text-green-700' : item.status === 'rejected' ? 'text-red-700 line-through' : 'text-gray-800'}`}
                        >
                          {item.documentName}
                          {item.required && (
                            <span className="text-red-400 ml-1">*</span>
                          )}
                        </p>
                        <div className="flex gap-2 mt-0.5">
                          <span className="text-[9px] font-bold px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded capitalize">
                            {item.category}
                          </span>
                          {item.rejectionReason && (
                            <span className="text-[9px] text-red-500">
                              {item.rejectionReason}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {item.status !== 'verified' && (
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleVerify(item._id)}
                          disabled={!!actionLoading}
                          className="px-2 py-1 bg-green-500 text-white rounded-lg text-[9px] font-black hover:bg-green-600 disabled:opacity-50"
                        >
                          {actionLoading === `verify_${item._id}`
                            ? '...'
                            : 'Verify'}
                        </button>
                        <button
                          onClick={() => handleRejectDoc(item._id)}
                          disabled={!!actionLoading}
                          className="px-2 py-1 bg-red-100 text-red-600 rounded-lg text-[9px] font-black hover:bg-red-200 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Financial ─────────────────────────────────────────── */}
        {activeTab === 'financial' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:col-span-2">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-black text-gray-700">
                  Financial Assessment
                </h3>
                <button
                  onClick={() =>
                    visaAPI.recalculateFinancial(id).then(fetchVisa)
                  }
                  className="px-3 py-1.5 text-xs font-bold text-white rounded-xl hover:opacity-90"
                  style={{ backgroundColor: primary }}
                >
                  Recalculate
                </button>
              </div>
              {fa ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    [
                      'Required Amount',
                      `${fa.currency} ${fa.requiredAmount?.toLocaleString() || 0}`,
                    ],
                    [
                      'Available Funds',
                      `${fa.currency} ${fa.availableFunds?.toLocaleString() || 0}`,
                    ],
                    [
                      'Living Cost Required',
                      `${fa.currency} ${fa.livingCostRequirement?.toLocaleString() || 0}`,
                    ],
                    ['GIC Status', fa.gicStatus],
                    ['Blocked Account', fa.blockedAccountStatus],
                    ['OSHC Status', fa.oshcStatus],
                    ['IHS Status', fa.ihsStatus],
                    ['Recommendation', fa.recommendationResult],
                  ].map(
                    ([label, value]) =>
                      value && (
                        <div
                          key={label}
                          className={`p-3 rounded-xl ${label === 'Recommendation' && value === 'insufficient' ? 'bg-red-50' : label === 'Recommendation' && value === 'strong' ? 'bg-green-50' : 'bg-gray-50'}`}
                        >
                          <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">
                            {label}
                          </p>
                          <p className="text-sm font-black text-gray-800 mt-1 capitalize">
                            {value}
                          </p>
                        </div>
                      )
                  )}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">
                  No financial assessment yet
                </p>
              )}

              {fa?.riskFlags?.length > 0 && (
                <div className="mt-4 p-3 bg-red-50 rounded-xl">
                  <p className="text-xs font-black text-red-700 mb-1">
                    ⚠ Risk Flags
                  </p>
                  <ul className="space-y-1">
                    {fa.riskFlags.map((flag, i) => (
                      <li key={i} className="text-[10px] text-red-600">
                        • {flag}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Interview ─────────────────────────────────────────── */}
        {activeTab === 'interview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Interview */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-black text-gray-700">Interview</h3>
                {visa.ruleSnapshot?.interviewRequired &&
                  visa.interview?.status === 'not_scheduled' && (
                    <button
                      onClick={() => setShowInterviewModal(true)}
                      className="px-3 py-1.5 text-xs font-bold text-white rounded-xl hover:opacity-90"
                      style={{ backgroundColor: primary }}
                    >
                      Schedule
                    </button>
                  )}
              </div>
              {visa.interview?.scheduledDate ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Date</span>
                    <span className="font-bold">
                      {new Date(visa.interview.scheduledDate).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Venue</span>
                    <span className="font-bold">{visa.interview.venue}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Type</span>
                    <span className="font-bold capitalize">
                      {visa.interview.type}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Status</span>
                    <span className="font-bold capitalize">
                      {visa.interview.status}
                    </span>
                  </div>
                  {visa.interview.mockInterviewScore && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Mock Score</span>
                      <span className="font-bold">
                        {visa.interview.mockInterviewScore}/10
                      </span>
                    </div>
                  )}
                  {visa.interview.status === 'scheduled' && (
                    <button
                      onClick={() =>
                        action('interview_complete', () =>
                          visaAPI.completeInterview(id, {
                            mockInterviewScore: 7,
                            outcomeNotes: 'Completed',
                          })
                        )
                      }
                      className="w-full py-2 mt-2 bg-green-50 text-green-700 rounded-xl text-xs font-bold hover:bg-green-100"
                    >
                      Mark Complete
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">
                  {visa.ruleSnapshot?.interviewRequired
                    ? 'Not yet scheduled'
                    : 'Not required for this country'}
                </p>
              )}
            </div>

            {/* Biometrics */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-black text-gray-700">Biometrics</h3>
                {visa.ruleSnapshot?.biometricRequired &&
                  visa.biometrics?.status === 'not_required' && (
                    <button
                      onClick={() => setShowBiometricsModal(true)}
                      className="px-3 py-1.5 text-xs font-bold text-white rounded-xl hover:opacity-90"
                      style={{ backgroundColor: primary }}
                    >
                      Schedule
                    </button>
                  )}
              </div>
              {visa.biometrics?.scheduledDate ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Date</span>
                    <span className="font-bold">
                      {new Date(visa.biometrics.scheduledDate).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Venue</span>
                    <span className="font-bold">{visa.biometrics.venue}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Status</span>
                    <span className="font-bold capitalize">
                      {visa.biometrics.status}
                    </span>
                  </div>
                  {visa.biometrics.status === 'scheduled' && (
                    <button
                      onClick={() =>
                        action('biometrics_complete', () =>
                          visaAPI.completeBiometrics(id)
                        )
                      }
                      className="w-full py-2 mt-2 bg-green-50 text-green-700 rounded-xl text-xs font-bold hover:bg-green-100"
                    >
                      Mark Complete
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">
                  {visa.ruleSnapshot?.biometricRequired
                    ? 'Not yet scheduled'
                    : 'Not required for this country'}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── Timeline ──────────────────────────────────────────── */}
        {activeTab === 'timeline' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-black text-gray-700 mb-4">
              Application Timeline
            </h3>
            {visa.timeline?.length === 0 ? (
              <p className="text-xs text-gray-400 italic text-center py-8">
                No activity yet
              </p>
            ) : (
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-100" />
                <div className="space-y-4">
                  {[...visa.timeline].reverse().map((event, i) => (
                    <div key={event._id || i} className="flex gap-3 relative">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10"
                        style={{
                          backgroundColor: `${primary}20`,
                          color: primary,
                        }}
                      >
                        <Clock size={14} />
                      </div>
                      <div className="pb-3">
                        <p className="text-xs font-bold text-gray-800">
                          {event.description}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {new Date(event.createdAt).toLocaleString()}
                          {event.performedBy?.name &&
                            ` · ${event.performedBy.name}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Risk ──────────────────────────────────────────────── */}
        {activeTab === 'risk' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={() => setShowRiskModal(true)}
                className="px-4 py-2 text-white rounded-xl text-xs font-bold hover:opacity-90"
                style={{ backgroundColor: primary }}
              >
                Run Risk Assessment
              </button>
            </div>
            {risk?.visaSuccessProbability !== undefined ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <h3 className="text-sm font-black text-gray-700 mb-4">
                    Risk Score
                  </h3>
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className="w-20 h-20 rounded-full flex items-center justify-center font-black text-xl"
                      style={{
                        backgroundColor: `${primary}15`,
                        color: primary,
                      }}
                    >
                      {risk.visaSuccessProbability}%
                    </div>
                    <div>
                      <p
                        className={`text-sm font-black capitalize ${risk.riskCategory === 'low' ? 'text-green-600' : risk.riskCategory === 'medium' ? 'text-amber-600' : 'text-red-600'}`}
                      >
                        {risk.riskCategory?.replace(/_/g, ' ')} risk
                      </p>
                      <p className="text-xs text-gray-400">
                        Assessed{' '}
                        {risk.assessedAt
                          ? new Date(risk.assessedAt).toLocaleDateString()
                          : 'just now'}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(risk.factors || {})
                      .filter(([, v]) => v !== undefined)
                      .map(([key, val]) => (
                        <div key={key} className="bg-gray-50 rounded-xl p-2">
                          <p className="text-[8px] text-gray-400 font-black uppercase">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </p>
                          <p className="text-sm font-black text-gray-800">
                            {val}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
                <div className="space-y-3">
                  {risk.reasons?.length > 0 && (
                    <div className="bg-red-50 rounded-2xl p-4 border border-red-100">
                      <h4 className="text-xs font-black text-red-700 mb-2">
                        ⚠ Risk Factors
                      </h4>
                      <ul className="space-y-1">
                        {risk.reasons.map((r, i) => (
                          <li key={i} className="text-[10px] text-red-600">
                            • {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {risk.recommendations?.length > 0 && (
                    <div className="bg-green-50 rounded-2xl p-4 border border-green-100">
                      <h4 className="text-xs font-black text-green-700 mb-2">
                        ✓ Recommendations
                      </h4>
                      <ul className="space-y-1">
                        {risk.recommendations.map((r, i) => (
                          <li key={i} className="text-[10px] text-green-700">
                            • {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center text-gray-300">
                <Shield size={48} className="mx-auto mb-3 opacity-30" />
                <p className="font-bold text-sm">No risk assessment run yet</p>
                <p className="text-xs mt-1">
                  Click "Run Risk Assessment" to evaluate this application
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── Modals ─── */}
      {/* Stage Modal */}
      {showStageModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 shadow-2xl w-full max-w-sm mx-4">
            <h3 className="text-base font-black mb-4">Update Stage</h3>
            <select
              value={newStage}
              onChange={(e) => setNewStage(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none mb-4"
            >
              {Object.entries(STAGE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={() => setShowStageModal(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleStageUpdate}
                disabled={!!actionLoading}
                className="flex-1 py-2.5 text-white rounded-xl text-xs font-bold hover:opacity-90"
                style={{ backgroundColor: primary }}
              >
                {actionLoading === 'stage' ? 'Updating...' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Risk Modal */}
      {showRiskModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 shadow-2xl w-full max-w-sm mx-4">
            <h3 className="text-base font-black mb-4">
              Risk Assessment Inputs
            </h3>
            <div className="space-y-3">
              {[
                {
                  label: 'Academic GPA (0-4)',
                  key: 'academicGPA',
                  type: 'number',
                  step: '0.1',
                  min: 0,
                  max: 4,
                },
                {
                  label: 'English Test Type',
                  key: 'englishTestType',
                  type: 'select',
                  options: ['ielts', 'pte', 'toefl', 'duolingo', 'none'],
                },
                {
                  label: 'English Score',
                  key: 'englishScore',
                  type: 'number',
                  step: '0.5',
                },
                { label: 'Gap Years', key: 'gapYears', type: 'number', min: 0 },
                {
                  label: 'Prior Refusals',
                  key: 'refusalCount',
                  type: 'number',
                  min: 0,
                },
              ].map(({ label, key, type, options, ...rest }) => (
                <div key={key}>
                  <label className="text-xs font-bold text-gray-600 block mb-1">
                    {label}
                  </label>
                  {type === 'select' ? (
                    <select
                      value={riskForm[key]}
                      onChange={(e) =>
                        setRiskForm((f) => ({ ...f, [key]: e.target.value }))
                      }
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none"
                    >
                      {options.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={type}
                      value={riskForm[key]}
                      {...rest}
                      onChange={(e) =>
                        setRiskForm((f) => ({
                          ...f,
                          [key]: Number(e.target.value),
                        }))
                      }
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none"
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowRiskModal(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleRiskAssess}
                disabled={!!actionLoading}
                className="flex-1 py-2.5 text-white rounded-xl text-xs font-bold hover:opacity-90"
                style={{ backgroundColor: primary }}
              >
                {actionLoading === 'risk' ? 'Calculating...' : 'Run Assessment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interview Modal */}
      {showInterviewModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 shadow-2xl w-full max-w-sm mx-4">
            <h3 className="text-base font-black mb-4">Schedule Interview</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold block mb-1">
                  Date & Time *
                </label>
                <input
                  type="datetime-local"
                  value={interviewForm.scheduledDate}
                  onChange={(e) =>
                    setInterviewForm((f) => ({
                      ...f,
                      scheduledDate: e.target.value,
                    }))
                  }
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold block mb-1">Venue</label>
                <input
                  value={interviewForm.venue}
                  onChange={(e) =>
                    setInterviewForm((f) => ({ ...f, venue: e.target.value }))
                  }
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none"
                  placeholder="e.g. U.S. Embassy, Maharajgunj"
                />
              </div>
              <div>
                <label className="text-xs font-bold block mb-1">Type</label>
                <select
                  value={interviewForm.type}
                  onChange={(e) =>
                    setInterviewForm((f) => ({ ...f, type: e.target.value }))
                  }
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none"
                >
                  {['embassy', 'vac', 'online', 'phone'].map((t) => (
                    <option key={t} value={t}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowInterviewModal(false)}
                className="flex-1 py-2.5 border rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleScheduleInterview}
                disabled={!!actionLoading}
                className="flex-1 py-2.5 text-white rounded-xl text-xs font-bold hover:opacity-90"
                style={{ backgroundColor: primary }}
              >
                {actionLoading === 'interview' ? 'Scheduling...' : 'Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Biometrics Modal */}
      {showBiometricsModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 shadow-2xl w-full max-w-sm mx-4">
            <h3 className="text-base font-black mb-4">Schedule Biometrics</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold block mb-1">
                  Date & Time *
                </label>
                <input
                  type="datetime-local"
                  value={biometricsForm.scheduledDate}
                  onChange={(e) =>
                    setBiometricsForm((f) => ({
                      ...f,
                      scheduledDate: e.target.value,
                    }))
                  }
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold block mb-1">
                  Venue (VFS Centre)
                </label>
                <input
                  value={biometricsForm.venue}
                  onChange={(e) =>
                    setBiometricsForm((f) => ({ ...f, venue: e.target.value }))
                  }
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none"
                  placeholder="e.g. VFS Global, Kathmandu"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowBiometricsModal(false)}
                className="flex-1 py-2.5 border rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleScheduleBiometrics}
                disabled={!!actionLoading}
                className="flex-1 py-2.5 text-white rounded-xl text-xs font-bold hover:opacity-90"
                style={{ backgroundColor: primary }}
              >
                {actionLoading === 'biometrics' ? 'Scheduling...' : 'Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve/Reject Modal */}
      {showDecisionModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 shadow-2xl w-full max-w-sm mx-4">
            <h3 className="text-base font-black mb-4">
              {showDecisionModal === 'approve'
                ? '✓ Approve Visa'
                : '✗ Record Rejection'}
            </h3>
            {showDecisionModal === 'approve' ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold block mb-1">
                    Visa Valid From
                  </label>
                  <input
                    type="date"
                    value={decisionForm.validFrom}
                    onChange={(e) =>
                      setDecisionForm((f) => ({
                        ...f,
                        validFrom: e.target.value,
                      }))
                    }
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1">
                    Visa Valid To
                  </label>
                  <input
                    type="date"
                    value={decisionForm.validTo}
                    onChange={(e) =>
                      setDecisionForm((f) => ({
                        ...f,
                        validTo: e.target.value,
                      }))
                    }
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="text-xs font-bold block mb-1">
                  Rejection Reason
                </label>
                <textarea
                  value={decisionForm.rejectionReason}
                  onChange={(e) =>
                    setDecisionForm((f) => ({
                      ...f,
                      rejectionReason: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none resize-none"
                  placeholder="e.g. Insufficient financial evidence..."
                />
              </div>
            )}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowDecisionModal('')}
                className="flex-1 py-2.5 border rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={
                  showDecisionModal === 'approve' ? handleApprove : handleReject
                }
                disabled={!!actionLoading}
                className={`flex-1 py-2.5 text-white rounded-xl text-xs font-bold hover:opacity-90 disabled:opacity-50 ${showDecisionModal === 'approve' ? 'bg-green-500' : 'bg-red-500'}`}
              >
                {actionLoading
                  ? 'Saving...'
                  : showDecisionModal === 'approve'
                    ? 'Approve'
                    : 'Record Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisaDetailPage;

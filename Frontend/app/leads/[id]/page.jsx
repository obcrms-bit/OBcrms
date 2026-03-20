'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CalendarClock, Mail, Phone, RefreshCw, Route, UserPlus } from 'lucide-react';
import AppShell from '@/components/app/app-shell';
import {
  CATEGORY_STYLES,
  ErrorState,
  LoadingState,
  StatusPill,
  formatDate,
  formatDateTime,
} from '@/components/app/shared';
import {
  CompleteFollowUpModal,
  ScheduleFollowUpModal,
} from '@/components/leads/follow-up-modals';
import { useAuth } from '@/context/AuthContext';
import { authAPI, leadAPI } from '@/services/api';
import { getEntityLabel, hasPermission } from '@/src/services/access';

const LEAD_STATUSES = [
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

function DetailCard({ title, items }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{title}</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <div key={item.label} className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              {item.label}
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-900">{item.value || 'Not set'}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const leadId = params?.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lead, setLead] = useState(null);
  const [counsellors, setCounsellors] = useState([]);
  const [workflow, setWorkflow] = useState(null);
  const [workflowStages, setWorkflowStages] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedCounsellorId, setSelectedCounsellorId] = useState('');
  const [assignmentReason, setAssignmentReason] = useState('');
  const [noteDraft, setNoteDraft] = useState('');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedFollowUp, setSelectedFollowUp] = useState(null);

  const canAssign = hasPermission(user, 'leads', 'assign');
  const entityLabel = getEntityLabel(lead, 'Client');

  const loadLead = async () => {
    setLoading(true);
    setError('');

    try {
      const requests = [leadAPI.getLeadById(leadId)];
      if (canAssign) {
        requests.push(authAPI.getUsers());
      }

      const results = await Promise.all(requests);
      const nextLead = results[0].data?.data?.lead || null;
      const nextWorkflow = results[0].data?.data?.workflow || null;
      const nextWorkflowStages = results[0].data?.data?.workflowStages || [];

      setLead(nextLead);
      setWorkflow(nextWorkflow);
      setWorkflowStages(nextWorkflowStages);
      setSelectedStatus(nextLead?.status || '');
      setSelectedCounsellorId(nextLead?.assignedCounsellor?._id || '');
      setCounsellors(canAssign ? results[1]?.data?.data?.users || [] : []);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to load the lead.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (leadId) {
      loadLead();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId, canAssign]);

  const orderedActivities = useMemo(
    () => [...(lead?.activities || [])].reverse(),
    [lead?.activities]
  );
  const orderedNotes = useMemo(() => [...(lead?.notes || [])].reverse(), [lead?.notes]);
  const orderedFollowUps = useMemo(
    () =>
      [...(lead?.followUps || [])].sort(
        (left, right) => new Date(right.scheduledAt) - new Date(left.scheduledAt)
      ),
    [lead?.followUps]
  );
  const nextPendingFollowUp = useMemo(
    () => orderedFollowUps.find((followUp) => followUp.status !== 'completed'),
    [orderedFollowUps]
  );

  const runAction = async (callback, fallbackMessage) => {
    setActionLoading(true);

    try {
      await callback();
      await loadLead();
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          fallbackMessage
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleScheduleFollowUp = async (form) => {
    await runAction(
      () => leadAPI.scheduleFollowUp(leadId, form),
      'Failed to schedule follow-up.'
    );
    setShowScheduleModal(false);
  };

  const handleCompleteFollowUp = async (form) => {
    if (!selectedFollowUp?._id) {
      return;
    }

    await runAction(
      () => leadAPI.completeFollowUp(leadId, selectedFollowUp._id, form),
      'Failed to complete the follow-up.'
    );
    setSelectedFollowUp(null);
  };

  const handleStatusChange = async () => {
    await runAction(
      () => leadAPI.updateStatus(leadId, selectedStatus),
      'Failed to update status.'
    );
  };

  const handleAssignCounsellor = async () => {
    if (!selectedCounsellorId) {
      return;
    }

    await runAction(
      () => leadAPI.assignCounsellor(leadId, selectedCounsellorId, assignmentReason),
      'Failed to assign counsellor.'
    );
  };

  const handleConvert = async () => {
    await runAction(() => leadAPI.convertToStudent(leadId), 'Failed to convert the lead.');
  };

  const handleRecalculate = async () => {
    await runAction(
      () => leadAPI.recalculateScore(leadId),
      'Failed to recalculate lead score.'
    );
  };

  const handleAddNote = async () => {
    if (!noteDraft.trim()) {
      return;
    }

    await runAction(() => leadAPI.addNote(leadId, noteDraft.trim()), 'Failed to add note.');
    setNoteDraft('');
  };

  return (
    <AppShell
      title={lead ? `${entityLabel} Profile` : 'Lead Detail'}
      description="Review the full pipeline profile, activity timeline, follow-up history, assignment, and conversion workflow in one place."
      actions={
        <>
          <Link
            href="/leads"
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Back to leads
          </Link>
          <Link
            href={`/leads/${leadId}/edit`}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Edit lead
          </Link>
          <button
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            onClick={loadLead}
            type="button"
          >
            Refresh
          </button>
        </>
      }
    >
      {loading ? <LoadingState label="Loading lead details..." /> : null}
      {!loading ? (
        <div className="space-y-6">
          {error ? <ErrorState message={error} onRetry={loadLead} /> : null}
          {lead ? (
        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-semibold text-slate-900">{lead.fullName || lead.name}</h3>
                    <p className="mt-2 text-sm text-slate-500">{lead.email || 'No email'}</p>
                    <p className="mt-1 text-sm font-medium text-teal-700">{entityLabel}</p>
                  </div>
                <StatusPill tone={lead.status}>{String(lead.status).replace(/_/g, ' ')}</StatusPill>
              </div>

              <div className="mt-5 space-y-3 text-sm text-slate-600">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <span>{lead.mobile || lead.phone || 'No mobile number'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <span>{lead.email || 'No email address'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <CalendarClock className="h-4 w-4 text-slate-400" />
                  <span>
                    Next follow-up:{' '}
                    {lead.nextFollowUp ? formatDateTime(lead.nextFollowUp) : 'Not scheduled'}
                  </span>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Score</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{lead.leadScore || 0}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Category</p>
                  <span
                    className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                      CATEGORY_STYLES[lead.leadCategory] || 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {lead.leadCategory || 'cold'}
                  </span>
                </div>
              </div>

              <button
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                disabled={actionLoading}
                onClick={handleRecalculate}
                type="button"
              >
                <RefreshCw className="h-4 w-4" />
                Recalculate score
              </button>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Assignment and Stage
              </p>
              <div className="mt-4 space-y-4">
                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-slate-700">Current stage</span>
                  <select
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:bg-white"
                    value={selectedStatus}
                    onChange={(event) => setSelectedStatus(event.target.value)}
                  >
                    {(workflowStages.length
                      ? workflowStages
                      : LEAD_STATUSES.map((status) => ({
                          key: status,
                          label: status.replace(/_/g, ' '),
                        }))
                    ).map((stage) => (
                      <option key={stage.key} value={stage.key}>
                        {stage.label}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={actionLoading}
                  onClick={handleStatusChange}
                  type="button"
                >
                  Update stage
                </button>

                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-slate-700">Counsellor</span>
                  <select
                    disabled={!canAssign}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                    value={selectedCounsellorId}
                    onChange={(event) => setSelectedCounsellorId(event.target.value)}
                  >
                    <option value="">Select a counsellor</option>
                    {counsellors.map((counsellor) => (
                      <option key={counsellor._id} value={counsellor._id}>
                        {counsellor.name}
                      </option>
                    ))}
                  </select>
                </label>
                <textarea
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:bg-white"
                  rows={3}
                  placeholder="Optional assignment reason"
                  value={assignmentReason}
                  onChange={(event) => setAssignmentReason(event.target.value)}
                />
                <button
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={actionLoading || !selectedCounsellorId || !canAssign}
                  onClick={handleAssignCounsellor}
                  type="button"
                >
                  <UserPlus className="h-4 w-4" />
                  Assign counsellor
                </button>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Country Workflow
              </p>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <p>
                  Preferred countries:{' '}
                  {lead.preferredCountries?.length ? lead.preferredCountries.join(', ') : 'Not set'}
                </p>
                <p>Workflow country: {workflow?.country || 'Tenant default workflow'}</p>
                <p>
                  Stages:{' '}
                  {(workflowStages || []).map((stage) => stage.label).join(' -> ') ||
                    'Not configured'}
                </p>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Quick Actions
              </p>
              <div className="mt-4 grid gap-3">
                <button
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  onClick={() => setShowScheduleModal(true)}
                  type="button"
                >
                  Schedule a follow-up
                </button>
                {nextPendingFollowUp ? (
                  <button
                    className="rounded-2xl border border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    onClick={() => setSelectedFollowUp(nextPendingFollowUp)}
                    type="button"
                  >
                    Complete current follow-up
                  </button>
                ) : null}
                {!lead.convertedToStudent ? (
                  <button
                    className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-left text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                    onClick={handleConvert}
                    type="button"
                  >
                    Convert to {entityLabel.toLowerCase()}
                  </button>
                ) : (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                    Converted to {entityLabel.toLowerCase()} on {formatDate(lead.convertedAt)}
                  </div>
                )}
              </div>
            </section>
          </aside>

          <section className="space-y-6">
            <div className="flex flex-wrap gap-2">
              {[
                ['overview', 'Overview'],
                ['timeline', 'Timeline'],
                ['notes', 'Notes'],
                ['followups', 'Follow-ups'],
              ].map(([tabKey, label]) => (
                <button
                  key={tabKey}
                  type="button"
                  onClick={() => setActiveTab(tabKey)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    activeTab === tabKey
                      ? 'bg-slate-900 text-white'
                      : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {activeTab === 'overview' ? (
              <div className="space-y-6">
                <DetailCard
                  title="Personal Info"
                  items={[
                    { label: 'Name', value: lead.fullName || lead.name },
                    { label: 'Email', value: lead.email },
                    { label: 'Address', value: lead.fullAddress },
                    { label: 'Phone', value: lead.phone },
                    { label: 'Mobile', value: lead.mobile || lead.phone },
                    { label: 'Date of Birth', value: lead.dob ? formatDate(lead.dob) : '' },
                    { label: 'Gender', value: lead.gender?.replace(/_/g, ' ') },
                    { label: 'Source', value: lead.source },
                    { label: 'Guardian Name', value: lead.guardianName },
                    { label: 'Guardian Contact', value: lead.guardianContact },
                    { label: 'Marital Status', value: lead.maritalStatus?.replace(/_/g, ' ') },
                    {
                      label: 'Applied before?',
                      value: typeof lead.appliedCountryBefore === 'boolean'
                        ? lead.appliedCountryBefore
                          ? 'Yes'
                          : 'No'
                        : '',
                    },
                    { label: 'How did you know us?', value: lead.howDidYouKnowUs },
                  ]}
                />

                <DetailCard
                  title="Interested Info"
                  items={[
                    { label: 'Interested For', value: lead.interestedFor },
                    { label: 'Course Level', value: lead.courseLevel || lead.preferredStudyLevel },
                    { label: 'Preferred Location', value: lead.preferredLocation },
                    { label: 'Interested Course', value: lead.interestedCourse },
                    {
                      label: 'Preferred Countries',
                      value: lead.preferredCountries?.length
                        ? lead.preferredCountries.join(', ')
                        : '',
                    },
                  ]}
                />

                <DetailCard
                  title="Other Info"
                  items={[
                    { label: 'Campaign', value: lead.campaign },
                    { label: 'Branch Name', value: lead.branchName || lead.branchId?.name },
                    { label: 'Assignee', value: lead.assignedCounsellor?.name },
                    { label: 'Stream', value: lead.stream },
                  ]}
                />

                <DetailCard
                  title="Preparation Info"
                  items={[
                    { label: 'Preparation Class', value: lead.preparationClass },
                    { label: 'Overall Score', value: lead.overallScore },
                    { label: 'Work Experience', value: lead.workExperience },
                  ]}
                />

                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Qualification Info
                  </p>
                  <div className="mt-6 space-y-4">
                    {lead.qualifications?.length ? (
                      lead.qualifications.map((qualification, index) => (
                        <div key={qualification._id || index} className="rounded-3xl border border-slate-200 p-4">
                          <div className="grid gap-4 md:grid-cols-3">
                            {[
                              ['Country', qualification.country],
                              ['Institution', qualification.institution],
                              ['Degree', qualification.degree],
                              ['Course', qualification.course],
                              ['Grade Type', qualification.gradeType],
                              ['Point', qualification.point],
                              ['Percentage Value', qualification.percentageValue],
                              ['University Title', qualification.universityTitle],
                              ['Level', qualification.level],
                              ['Passed Year', qualification.passedYear],
                              ['Started At', qualification.startedAt ? formatDate(qualification.startedAt) : ''],
                              ['Completed At', qualification.completedAt ? formatDate(qualification.completedAt) : ''],
                              ['Result Date', qualification.resultDate ? formatDate(qualification.resultDate) : ''],
                            ].map(([label, value]) => (
                              <div key={`${qualification._id || index}-${label}`} className="rounded-2xl bg-slate-50 p-4">
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                  {label}
                                </p>
                                <p className="mt-2 text-sm font-semibold text-slate-900">{value || 'Not set'}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">No qualification rows recorded yet.</p>
                    )}
                  </div>
                </section>
              </div>
            ) : null}

            {activeTab === 'timeline' ? (
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Activity Timeline
                </p>
                <div className="mt-6 space-y-4">
                  {orderedActivities.length === 0 ? (
                    <p className="text-sm text-slate-500">No activities recorded yet.</p>
                  ) : (
                    orderedActivities.map((activity, index) => (
                      <div key={activity._id || index} className="flex gap-4 rounded-2xl border border-slate-200 p-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                          <Route className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{activity.description}</p>
                          <p className="mt-1 text-sm text-slate-500">
                            {formatDateTime(activity.createdAt)}
                            {activity.performedBy?.name ? ` by ${activity.performedBy.name}` : ''}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            ) : null}

            {activeTab === 'notes' ? (
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Notes</p>
                    <h3 className="mt-2 text-xl font-semibold text-slate-900">Internal communication log</h3>
                  </div>
                </div>
                <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                  <div className="space-y-4">
                    {orderedNotes.length === 0 ? (
                      <p className="text-sm text-slate-500">No notes have been added yet.</p>
                    ) : (
                      orderedNotes.map((note, index) => (
                        <div key={note._id || index} className="rounded-2xl border border-slate-200 p-4">
                          <p className="text-sm leading-6 text-slate-700">{note.content}</p>
                          <p className="mt-3 text-xs text-slate-500">
                            {formatDateTime(note.createdAt)}
                            {note.createdBy?.name ? ` by ${note.createdBy.name}` : ''}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-900">Add note</p>
                    <textarea
                      rows={8}
                      className="mt-4 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500"
                      value={noteDraft}
                      onChange={(event) => setNoteDraft(event.target.value)}
                      placeholder="Record counselling context, objections, or next steps."
                    />
                    <button
                      type="button"
                      onClick={handleAddNote}
                      disabled={actionLoading || !noteDraft.trim()}
                      className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Save note
                    </button>
                  </div>
                </div>
              </section>
            ) : null}

            {activeTab === 'followups' ? (
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Follow-ups
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-slate-900">
                      Upcoming and completed follow-up history
                    </h3>
                  </div>
                  <button
                    className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                    onClick={() => setShowScheduleModal(true)}
                    type="button"
                  >
                    Schedule follow-up
                  </button>
                </div>
                <div className="mt-6 space-y-4">
                  {orderedFollowUps.length === 0 ? (
                    <p className="text-sm text-slate-500">No follow-ups have been scheduled yet.</p>
                  ) : (
                    orderedFollowUps.map((followUp, index) => (
                      <div key={followUp._id || index} className="rounded-2xl border border-slate-200 p-4">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <div className="flex flex-wrap gap-2">
                              <StatusPill tone={followUp.status}>{followUp.status}</StatusPill>
                              {followUp.outcomeType ? (
                                <StatusPill tone={followUp.outcomeType}>
                                  {followUp.outcomeType.replace(/_/g, ' ')}
                                </StatusPill>
                              ) : null}
                            </div>
                            <p className="mt-3 font-semibold capitalize text-slate-900">
                              {String(followUp.completionMethod || followUp.type || 'call').replace(/_/g, ' ')}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              Scheduled for {formatDateTime(followUp.scheduledAt)}
                            </p>
                            {followUp.notes ? (
                              <p className="mt-3 text-sm text-slate-700">{followUp.notes}</p>
                            ) : null}
                            {followUp.completionNotes ? (
                              <p className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                                {followUp.completionNotes}
                              </p>
                            ) : null}
                            <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
                              {followUp.completedAt ? (
                                <span>Completed: {formatDateTime(followUp.completedAt)}</span>
                              ) : null}
                              {followUp.nextFollowUpDate ? (
                                <span>Next: {formatDateTime(followUp.nextFollowUpDate)}</span>
                              ) : null}
                              {followUp.reminderMeta?.reminderStatus ? (
                                <span>
                                  Reminder: {followUp.reminderMeta.reminderStatus}
                                  {followUp.reminderMeta.reminderCount
                                    ? ` (${followUp.reminderMeta.reminderCount})`
                                    : ''}
                                </span>
                              ) : null}
                            </div>
                          </div>
                          {followUp.status !== 'completed' ? (
                            <button
                              type="button"
                              onClick={() => setSelectedFollowUp(followUp)}
                              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                            >
                              Mark Done
                            </button>
                          ) : null}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            ) : null}
          </section>
        </div>
          ) : null}
        </div>
      ) : null}

      <ScheduleFollowUpModal
        open={showScheduleModal}
        leadName={lead?.fullName || lead?.name}
        onClose={() => setShowScheduleModal(false)}
        onSubmit={handleScheduleFollowUp}
        submitting={actionLoading}
      />
      <CompleteFollowUpModal
        open={Boolean(selectedFollowUp)}
        followUp={selectedFollowUp}
        leadName={lead?.fullName || lead?.name}
        counsellorName={user?.name}
        onClose={() => setSelectedFollowUp(null)}
        onSubmit={handleCompleteFollowUp}
        submitting={actionLoading}
      />
    </AppShell>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

export const LEAD_SOURCES = [
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

export const GENDER_OPTIONS = [
  { value: '', label: 'Select gender' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

export const MARITAL_STATUS_OPTIONS = [
  { value: '', label: 'Select marital status' },
  { value: 'single', label: 'Single' },
  { value: 'married', label: 'Married' },
  { value: 'divorced', label: 'Divorced' },
  { value: 'widowed', label: 'Widowed' },
  { value: 'other', label: 'Other' },
];

export const FOLLOW_UP_METHODS = [
  { value: 'call', label: 'Call' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'Email' },
  { value: 'in_person', label: 'In-person' },
  { value: 'other', label: 'Other' },
];

const createQualificationRow = () => ({
  country: '',
  institution: '',
  degree: '',
  course: '',
  gradeType: '',
  point: '',
  percentageValue: '',
  universityTitle: '',
  level: '',
  passedYear: '',
  startedAt: '',
  completedAt: '',
  resultDate: '',
});

export const createLeadFormDefaults = () => ({
  serviceType: 'consultancy',
  name: '',
  email: '',
  fullAddress: '',
  phone: '',
  mobile: '',
  dob: '',
  gender: '',
  source: 'website',
  guardianName: '',
  guardianContact: '',
  maritalStatus: '',
  appliedCountryBefore: false,
  howDidYouKnowUs: '',
  interestedFor: '',
  courseLevel: '',
  preferredLocation: '',
  interestedCourse: '',
  preferredCountries: [],
  campaign: '',
  branchId: '',
  branchName: '',
  assignedCounsellor: '',
  stream: '',
  preparationClass: '',
  overallScore: '',
  workExperience: '',
  initialNote: '',
  qualifications: [createQualificationRow()],
});

export const mapLeadToForm = (lead) => ({
  serviceType: lead?.serviceType || 'consultancy',
  name: lead?.fullName || lead?.name || '',
  email: lead?.email || '',
  fullAddress: lead?.fullAddress || '',
  phone: lead?.phone || '',
  mobile: lead?.mobile || lead?.phone || '',
  dob: lead?.dob ? String(lead.dob).slice(0, 10) : '',
  gender: lead?.gender || '',
  source: lead?.source || 'website',
  guardianName: lead?.guardianName || '',
  guardianContact: lead?.guardianContact || '',
  maritalStatus: lead?.maritalStatus || '',
  appliedCountryBefore: Boolean(lead?.appliedCountryBefore),
  howDidYouKnowUs: lead?.howDidYouKnowUs || '',
  interestedFor: lead?.interestedFor || '',
  courseLevel: lead?.courseLevel || lead?.preferredStudyLevel || '',
  preferredLocation: lead?.preferredLocation || '',
  interestedCourse: lead?.interestedCourse || '',
  preferredCountries: Array.isArray(lead?.preferredCountries) ? lead.preferredCountries : [],
  campaign: lead?.campaign || '',
  branchId: lead?.branchId?._id || lead?.branchId || '',
  branchName: lead?.branchName || lead?.branchId?.name || '',
  assignedCounsellor: lead?.assignedCounsellor?._id || lead?.assignedCounsellor || '',
  stream: lead?.stream || '',
  preparationClass: lead?.preparationClass || '',
  overallScore: lead?.overallScore || '',
  workExperience: lead?.workExperience || '',
  initialNote: '',
  qualifications: lead?.qualifications?.length
    ? lead.qualifications.map((qualification) => ({
        country: qualification.country || '',
        institution: qualification.institution || '',
        degree: qualification.degree || '',
        course: qualification.course || '',
        gradeType: qualification.gradeType || '',
        point: qualification.point || '',
        percentageValue: qualification.percentageValue || '',
        universityTitle: qualification.universityTitle || '',
        level: qualification.level || '',
        passedYear: qualification.passedYear || '',
        startedAt: qualification.startedAt ? String(qualification.startedAt).slice(0, 10) : '',
        completedAt: qualification.completedAt ? String(qualification.completedAt).slice(0, 10) : '',
        resultDate: qualification.resultDate ? String(qualification.resultDate).slice(0, 10) : '',
      }))
    : [createQualificationRow()],
});

export const buildLeadPayload = (form) => {
  const qualifications = (form.qualifications || [])
    .map((qualification) => ({
      ...qualification,
      startedAt: qualification.startedAt || undefined,
      completedAt: qualification.completedAt || undefined,
      resultDate: qualification.resultDate || undefined,
    }))
    .filter((qualification) => Object.values(qualification).some(Boolean));

  return {
    serviceType: form.serviceType || 'consultancy',
    name: form.name.trim(),
    email: form.email.trim() || undefined,
    fullAddress: form.fullAddress.trim() || undefined,
    phone: form.phone.trim() || undefined,
    mobile: form.mobile.trim(),
    dob: form.dob || undefined,
    gender: form.gender || undefined,
    source: form.source || undefined,
    guardianName: form.guardianName.trim() || undefined,
    guardianContact: form.guardianContact.trim() || undefined,
    maritalStatus: form.maritalStatus || undefined,
    appliedCountryBefore: Boolean(form.appliedCountryBefore),
    howDidYouKnowUs: form.howDidYouKnowUs.trim() || undefined,
    interestedFor: form.interestedFor.trim(),
    courseLevel: form.courseLevel.trim(),
    preferredLocation: form.preferredLocation.trim() || undefined,
    interestedCourse: form.interestedCourse.trim() || undefined,
    preferredCountries: (form.preferredCountries || []).filter(Boolean),
    campaign: form.campaign.trim() || undefined,
    branchId: form.branchId || undefined,
    branchName: form.branchName.trim() || undefined,
    assignedCounsellor: form.assignedCounsellor || undefined,
    stream: form.stream.trim(),
    preparationClass: form.preparationClass.trim() || undefined,
    overallScore: form.overallScore.trim() || undefined,
    workExperience: form.workExperience.trim() || undefined,
    qualifications,
    ...(form.initialNote.trim()
      ? {
          notes: [{ content: form.initialNote.trim() }],
        }
      : {}),
  };
};

const Field = ({ label, required, children, hint }) => (
  <label className="block space-y-2">
    <span className="text-sm font-semibold text-slate-700">
      {label} {required ? <span className="text-rose-500">*</span> : null}
    </span>
    {children}
    {hint ? <span className="block text-xs text-slate-500">{hint}</span> : null}
  </label>
);

const Input = (props) => (
  <input
    {...props}
    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:bg-white"
  />
);

const Select = ({ children, ...props }) => (
  <select
    {...props}
    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:bg-white"
  >
    {children}
  </select>
);

const Textarea = (props) => (
  <textarea
    {...props}
    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:bg-white"
  />
);

export default function LeadForm({
  initialValue,
  branches = [],
  counsellors = [],
  countryWorkflows = [],
  submitting = false,
  submitLabel = 'Save lead',
  mode = 'create',
  onSubmit,
}) {
  const [form, setForm] = useState(createLeadFormDefaults());
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    setForm(initialValue ? mapLeadToForm(initialValue) : createLeadFormDefaults());
  }, [initialValue]);

  const branchLookup = useMemo(
    () => Object.fromEntries(branches.map((branch) => [branch._id, branch])),
    [branches]
  );
  const availableCountries = useMemo(
    () => countryWorkflows.map((workflow) => workflow.country).filter(Boolean),
    [countryWorkflows]
  );
  const activeWorkflow = useMemo(
    () =>
      countryWorkflows.find((workflow) =>
        form.preferredCountries?.some((country) => country === workflow.country)
      ) || null,
    [countryWorkflows, form.preferredCountries]
  );

  const setField = (field, value) =>
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

  const togglePreferredCountry = (country) =>
    setForm((current) => ({
      ...current,
      preferredCountries: current.preferredCountries.includes(country)
        ? current.preferredCountries.filter((item) => item !== country)
        : [...current.preferredCountries, country],
    }));

  const setQualificationField = (index, field, value) =>
    setForm((current) => ({
      ...current,
      qualifications: current.qualifications.map((qualification, rowIndex) =>
        rowIndex === index ? { ...qualification, [field]: value } : qualification
      ),
    }));

  const addQualification = () =>
    setForm((current) => ({
      ...current,
      qualifications: [...current.qualifications, createQualificationRow()],
    }));

  const removeQualification = (index) =>
    setForm((current) => ({
      ...current,
      qualifications:
        current.qualifications.length === 1
          ? [createQualificationRow()]
          : current.qualifications.filter((_, rowIndex) => rowIndex !== index),
    }));

  const validate = () => {
    const nextErrors = [];

    if (!form.name.trim()) nextErrors.push('Lead name is required.');
    if (!form.mobile.trim()) nextErrors.push('Mobile number is required.');
    if (!form.interestedFor.trim()) nextErrors.push('Interested For is required.');
    if (!form.courseLevel.trim()) nextErrors.push('Course Level is required.');
    if (!form.stream.trim()) nextErrors.push('Stream is required.');
    if (!form.branchName.trim() && !form.branchId) nextErrors.push('Branch Name is required.');
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.push('Email address is invalid.');
    }

    setErrors(nextErrors);
    return nextErrors.length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) {
      return;
    }

    const payload = buildLeadPayload(form);
    await onSubmit?.(payload, form);
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {errors.length ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
          <p className="font-semibold">Please fix the following:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Personal Info</h3>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field
            label="Service Type"
            required
            hint={
              form.serviceType === 'test_prep'
                ? 'This record will be treated as a Student journey.'
                : 'This record will be treated as a Client journey.'
            }
          >
            <Select
              value={form.serviceType}
              onChange={(event) => setField('serviceType', event.target.value)}
            >
              <option value="consultancy">Consultancy / Client</option>
              <option value="test_prep">Test Preparation / Student</option>
            </Select>
          </Field>
          <Field label="Name" required>
            <Input value={form.name} onChange={(event) => setField('name', event.target.value)} />
          </Field>
          <Field label="Email">
            <Input
              type="email"
              value={form.email}
              onChange={(event) => setField('email', event.target.value)}
            />
          </Field>
          <Field label="Address">
            <Input
              value={form.fullAddress}
              onChange={(event) => setField('fullAddress', event.target.value)}
            />
          </Field>
          <Field label="Phone">
            <Input value={form.phone} onChange={(event) => setField('phone', event.target.value)} />
          </Field>
          <Field label="Mobile" required>
            <Input
              value={form.mobile}
              onChange={(event) => setField('mobile', event.target.value)}
            />
          </Field>
          <Field label="Date of Birth">
            <Input type="date" value={form.dob} onChange={(event) => setField('dob', event.target.value)} />
          </Field>
          <Field label="Gender">
            <Select value={form.gender} onChange={(event) => setField('gender', event.target.value)}>
              {GENDER_OPTIONS.map((option) => (
                <option key={option.value || 'empty'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Source">
            <Select value={form.source} onChange={(event) => setField('source', event.target.value)}>
              {LEAD_SOURCES.map((source) => (
                <option key={source} value={source}>
                  {source.replace(/_/g, ' ')}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Guardian Name">
            <Input
              value={form.guardianName}
              onChange={(event) => setField('guardianName', event.target.value)}
            />
          </Field>
          <Field label="Guardian Contact">
            <Input
              value={form.guardianContact}
              onChange={(event) => setField('guardianContact', event.target.value)}
            />
          </Field>
          <Field label="Marital Status">
            <Select
              value={form.maritalStatus}
              onChange={(event) => setField('maritalStatus', event.target.value)}
            >
              {MARITAL_STATUS_OPTIONS.map((option) => (
                <option key={option.value || 'empty'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="How did you know about us?">
            <Input
              value={form.howDidYouKnowUs}
              onChange={(event) => setField('howDidYouKnowUs', event.target.value)}
            />
          </Field>
        </div>
        <label className="mt-4 flex items-center gap-3 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={form.appliedCountryBefore}
            onChange={(event) => setField('appliedCountryBefore', event.target.checked)}
          />
          Applied to any country before?
        </label>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Interested Info</h3>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="Interested For" required>
            <Input
              value={form.interestedFor}
              onChange={(event) => setField('interestedFor', event.target.value)}
            />
          </Field>
          <Field label="Course Level" required>
            <Input
              value={form.courseLevel}
              onChange={(event) => setField('courseLevel', event.target.value)}
            />
          </Field>
          <Field label="Preferred Location">
            <Input
              value={form.preferredLocation}
              onChange={(event) => setField('preferredLocation', event.target.value)}
            />
          </Field>
          <Field label="Interested Course">
            <Input
              value={form.interestedCourse}
              onChange={(event) => setField('interestedCourse', event.target.value)}
            />
          </Field>
          <Field
            label="Preferred Countries"
            hint="Used for counsellor auto-matching and country-specific workflow rules."
          >
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {availableCountries.map((country) => {
                  const selected = form.preferredCountries.includes(country);
                  return (
                    <button
                      key={country}
                      type="button"
                      onClick={() => togglePreferredCountry(country)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                        selected
                          ? 'border-teal-600 bg-teal-50 text-teal-700'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {country}
                    </button>
                  );
                })}
              </div>
              <Input
                placeholder="Add more countries separated by commas"
                value={form.preferredCountries.join(', ')}
                onChange={(event) =>
                  setField(
                    'preferredCountries',
                    event.target.value
                      .split(',')
                      .map((item) => item.trim())
                      .filter(Boolean)
                  )
                }
              />
            </div>
          </Field>
        </div>
        {activeWorkflow ? (
          <div className="mt-5 rounded-3xl border border-teal-100 bg-teal-50/60 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">
              Country Workflow Preview
            </p>
            <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr_1fr]">
              <div>
                <p className="text-sm font-semibold text-slate-900">Lead stages</p>
                <p className="mt-2 text-sm text-slate-600">
                  {(activeWorkflow.leadStages || []).map((stage) => stage.label).join(' -> ') ||
                    'Not configured'}
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Application stages</p>
                <p className="mt-2 text-sm text-slate-600">
                  {(activeWorkflow.applicationStages || [])
                    .map((stage) => stage.label)
                    .join(' -> ') || 'Not configured'}
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">SLA / follow-up</p>
                <p className="mt-2 text-sm text-slate-600">
                  {activeWorkflow.followUpRules?.initialHours || 0}h first follow-up,{' '}
                  {activeWorkflow.slaRules?.firstResponseHours || 0}h first response SLA
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Other Info</h3>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="Campaign">
            <Input value={form.campaign} onChange={(event) => setField('campaign', event.target.value)} />
          </Field>
          <Field label="Branch Name" required hint="Choose an existing branch or type one manually.">
            <div className="space-y-2">
              <Select
                value={form.branchId}
                onChange={(event) => {
                  const selectedBranch = branchLookup[event.target.value];
                  setForm((current) => ({
                    ...current,
                    branchId: event.target.value,
                    branchName: selectedBranch?.name || current.branchName,
                  }));
                }}
              >
                <option value="">Select a branch</option>
                {branches.map((branch) => (
                  <option key={branch._id} value={branch._id}>
                    {branch.name}
                  </option>
                ))}
              </Select>
              <Input
                placeholder="Or type branch name"
                value={form.branchName}
                onChange={(event) => setField('branchName', event.target.value)}
              />
            </div>
          </Field>
          <Field label="Assignee">
            <Select
              value={form.assignedCounsellor}
              onChange={(event) => setField('assignedCounsellor', event.target.value)}
            >
              <option value="">Select staff</option>
              {counsellors.map((counsellor) => (
                <option key={counsellor._id} value={counsellor._id}>
                  {counsellor.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Stream" required>
            <Input value={form.stream} onChange={(event) => setField('stream', event.target.value)} />
          </Field>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Preparation Info</h3>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <Field label="Preparation Class">
            <Input
              value={form.preparationClass}
              onChange={(event) => setField('preparationClass', event.target.value)}
            />
          </Field>
          <Field label="Overall Score">
            <Input
              value={form.overallScore}
              onChange={(event) => setField('overallScore', event.target.value)}
            />
          </Field>
          <Field label="Work Experience">
            <Input
              value={form.workExperience}
              onChange={(event) => setField('workExperience', event.target.value)}
            />
          </Field>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Qualification Info</h3>
            <p className="mt-1 text-sm text-slate-500">
              Add as many education records as needed.
            </p>
          </div>
          <button
            type="button"
            onClick={addQualification}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <Plus className="h-4 w-4" />
            Add Row
          </button>
        </div>
        <div className="mt-5 space-y-4">
          {form.qualifications.map((qualification, index) => (
            <div key={`qualification-${index}`} className="rounded-3xl border border-slate-200 p-4">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-semibold text-slate-700">Qualification {index + 1}</p>
                <button
                  type="button"
                  onClick={() => removeQualification(index)}
                  className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Remove
                </button>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                {[
                  ['country', 'Country'],
                  ['institution', 'Institution'],
                  ['degree', 'Degree'],
                  ['course', 'Course'],
                  ['gradeType', 'Percent / Grade Type'],
                  ['point', 'Point'],
                  ['percentageValue', 'Percentage Value'],
                  ['universityTitle', 'University Title'],
                  ['level', 'Level'],
                  ['passedYear', 'Passed Year'],
                ].map(([field, label]) => (
                  <Field key={field} label={label}>
                    <Input
                      value={qualification[field]}
                      onChange={(event) =>
                        setQualificationField(index, field, event.target.value)
                      }
                    />
                  </Field>
                ))}
                <Field label="Start Date">
                  <Input
                    type="date"
                    value={qualification.startedAt}
                    onChange={(event) =>
                      setQualificationField(index, 'startedAt', event.target.value)
                    }
                  />
                </Field>
                <Field label="Completed Date">
                  <Input
                    type="date"
                    value={qualification.completedAt}
                    onChange={(event) =>
                      setQualificationField(index, 'completedAt', event.target.value)
                    }
                  />
                </Field>
                <Field label="Result Date">
                  <Input
                    type="date"
                    value={qualification.resultDate}
                    onChange={(event) =>
                      setQualificationField(index, 'resultDate', event.target.value)
                    }
                  />
                </Field>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">
          {mode === 'create' ? 'Initial Notes' : 'Add New Note'}
        </h3>
        <Textarea
          rows={4}
          value={form.initialNote}
          onChange={(event) => setField('initialNote', event.target.value)}
          placeholder="Add context for the counselling and follow-up team."
        />
      </section>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
}

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Globe } from 'lucide-react';
import { visaAPI, visaRuleAPI } from '../services/api';
import { useBranding } from '../context/BrandingContext';

const COUNTRIES = [
  { code: 'UK', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'IE', name: 'Ireland', flag: '🇮🇪' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
];

const VISA_TYPES = [
  { value: 'student', label: 'Student Visa' },
  { value: 'tier4', label: 'UK Tier 4 / Student Route' },
  { value: 'f1', label: 'US F1 Student Visa' },
  { value: 'm1', label: 'US M1 Vocational Visa' },
  { value: 'study_permit', label: 'Canada Study Permit' },
  { value: 'student_visa', label: 'Australia Student Visa (SubClass 500)' },
  { value: 'national_visa', label: 'Germany National D Visa' },
  { value: 'other', label: 'Other' },
];

const Input = ({ ...props }) => (
  <input
    {...props}
    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all"
  />
);
const Field = ({ label, required, children }) => (
  <div>
    <label className="block text-xs font-bold text-gray-600 mb-1.5">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    {children}
  </div>
);

const VisaCreatePage = () => {
  const navigate = useNavigate();
  const { branding } = useBranding();
  const primary = branding?.primaryColor || '#6366f1';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedRule, setSelectedRule] = useState(null);
  const [loadingRule, setLoadingRule] = useState(false);

  const [form, setForm] = useState({
    destinationCountryCode: '',
    destinationCountry: '',
    flagEmoji: '',
    visaType: 'student',
    universityName: '',
    courseName: '',
    studyLevel: '',
    intakeDate: '',
    courseStartDate: '',
    courseDuration: '',
    // Applicant info
    applicantSnapshot: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      nationality: 'Nepalese',
      passportNumber: '',
      passportExpiry: '',
    },
    notes: [],
  });

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));
  const setApplicant = (key, val) =>
    setForm((f) => ({
      ...f,
      applicantSnapshot: { ...f.applicantSnapshot, [key]: val },
    }));

  const handleCountrySelect = async (code) => {
    const country = COUNTRIES.find((c) => c.code === code);
    set('destinationCountryCode', code);
    set('destinationCountry', country?.name || '');
    set('flagEmoji', country?.flag || '');

    if (code) {
      // Auto-select visa type based on country
      const typeMap = {
        UK: 'tier4',
        US: 'f1',
        CA: 'study_permit',
        AU: 'student_visa',
        DE: 'national_visa',
      };
      if (typeMap[code]) set('visaType', typeMap[code]);

      setLoadingRule(true);
      try {
        const res = await visaRuleAPI.getByCountry(code);
        setSelectedRule(res.data.data.rule);
      } catch (e) {
        setSelectedRule(null);
      } finally {
        setLoadingRule(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await visaAPI.create(form);
      const visaId = res.data.data.visa._id;

      // Auto-generate workflow if rule found
      if (selectedRule) {
        await visaAPI.generateWorkflow(visaId);
      }

      navigate(`/admin/visa/${visaId}`);
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to create visa application'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/admin/visa')}
          className="p-2 hover:bg-gray-100 rounded-xl transition-all"
        >
          <ArrowLeft size={18} className="text-gray-500" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-gray-800">
            New Visa Application
          </h1>
          <p className="text-xs text-gray-400">
            Workflow will be auto-generated from country rules
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex-1 overflow-y-auto space-y-5 pb-6"
      >
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Country Selection */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-black text-gray-700 mb-4 flex items-center gap-2">
            <Globe size={16} /> Destination Country *
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {COUNTRIES.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => handleCountrySelect(c.code)}
                className={`p-3 rounded-xl border-2 text-center transition-all ${
                  form.destinationCountryCode === c.code
                    ? 'border-transparent text-white shadow-md'
                    : 'border-gray-100 hover:border-gray-200 bg-gray-50'
                }`}
                style={
                  form.destinationCountryCode === c.code
                    ? { backgroundColor: primary, borderColor: primary }
                    : {}
                }
              >
                <span className="text-2xl block mb-1">{c.flag}</span>
                <span
                  className={`text-[10px] font-black ${form.destinationCountryCode === c.code ? 'text-white' : 'text-gray-600'}`}
                >
                  {c.name}
                </span>
              </button>
            ))}
          </div>

          {loadingRule && (
            <div className="text-xs text-gray-400 animate-pulse">
              Loading visa rules...
            </div>
          )}
          {selectedRule && (
            <div className="bg-green-50 border border-green-100 rounded-xl p-4">
              <p className="text-xs font-bold text-green-700 mb-1">
                ✓ Visa rule loaded for {selectedRule.country}
              </p>
              <p className="text-[10px] text-green-600">
                {selectedRule.requiredDocuments?.length} required documents ·
                Processing: {selectedRule.processingTimeWeeksMin}-
                {selectedRule.processingTimeWeeksMax} weeks · Biometrics:{' '}
                {selectedRule.biometricRequired ? 'Required' : 'Not required'}·
                Interview:{' '}
                {selectedRule.interviewRequired ? 'Required' : 'Not required'}
              </p>
            </div>
          )}
          {!selectedRule && form.destinationCountryCode && !loadingRule && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
              <p className="text-xs font-bold text-amber-600">
                ⚠ No visa rule found for {form.destinationCountryCode}. Create
                one in Visa Rules first.
              </p>
            </div>
          )}
        </div>

        {/* Visa Type */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-black text-gray-700 mb-4">Visa Type</h2>
          <div className="grid grid-cols-2 gap-2">
            {VISA_TYPES.map((vt) => (
              <button
                key={vt.value}
                type="button"
                onClick={() => set('visaType', vt.value)}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  form.visaType === vt.value
                    ? 'text-white border-transparent shadow-md'
                    : 'border-gray-100 hover:border-gray-200 bg-gray-50'
                }`}
                style={
                  form.visaType === vt.value ? { backgroundColor: primary } : {}
                }
              >
                <span
                  className={`text-[11px] font-bold ${form.visaType === vt.value ? 'text-white' : 'text-gray-700'}`}
                >
                  {vt.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Applicant Info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-black text-gray-700 mb-4">
            👤 Applicant Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="First Name" required>
              <Input
                required
                value={form.applicantSnapshot.firstName}
                onChange={(e) => setApplicant('firstName', e.target.value)}
                placeholder="John"
              />
            </Field>
            <Field label="Last Name" required>
              <Input
                required
                value={form.applicantSnapshot.lastName}
                onChange={(e) => setApplicant('lastName', e.target.value)}
                placeholder="Doe"
              />
            </Field>
            <Field label="Email">
              <Input
                type="email"
                value={form.applicantSnapshot.email}
                onChange={(e) => setApplicant('email', e.target.value)}
                placeholder="john@gmail.com"
              />
            </Field>
            <Field label="Phone">
              <Input
                value={form.applicantSnapshot.phone}
                onChange={(e) => setApplicant('phone', e.target.value)}
                placeholder="+977-..."
              />
            </Field>
            <Field label="Nationality">
              <Input
                value={form.applicantSnapshot.nationality}
                onChange={(e) => setApplicant('nationality', e.target.value)}
              />
            </Field>
            <Field label="Passport Number">
              <Input
                value={form.applicantSnapshot.passportNumber}
                onChange={(e) => setApplicant('passportNumber', e.target.value)}
              />
            </Field>
            <Field label="Passport Expiry">
              <Input
                type="date"
                value={form.applicantSnapshot.passportExpiry}
                onChange={(e) => setApplicant('passportExpiry', e.target.value)}
              />
            </Field>
          </div>
        </div>

        {/* University / Course Info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-black text-gray-700 mb-4">
            🎓 Course & University
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="University Name">
              <Input
                value={form.universityName}
                onChange={(e) => set('universityName', e.target.value)}
                placeholder="e.g. University of Manchester"
              />
            </Field>
            <Field label="Course Name">
              <Input
                value={form.courseName}
                onChange={(e) => set('courseName', e.target.value)}
                placeholder="e.g. MSc Computer Science"
              />
            </Field>
            <Field label="Study Level">
              <select
                value={form.studyLevel}
                onChange={(e) => set('studyLevel', e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none"
              >
                <option value="">Select level</option>
                {[
                  'certificate',
                  'diploma',
                  'bachelor',
                  'postgraduate',
                  'phd',
                ].map((l) => (
                  <option key={l} value={l}>
                    {l.charAt(0).toUpperCase() + l.slice(1)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Intake Date">
              <Input
                type="date"
                value={form.intakeDate}
                onChange={(e) => set('intakeDate', e.target.value)}
              />
            </Field>
            <Field label="Course Start Date">
              <Input
                type="date"
                value={form.courseStartDate}
                onChange={(e) => set('courseStartDate', e.target.value)}
              />
            </Field>
            <Field label="Course Duration">
              <Input
                value={form.courseDuration}
                onChange={(e) => set('courseDuration', e.target.value)}
                placeholder="e.g. 1 year"
              />
            </Field>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={() => navigate('/admin/visa')}
            className="px-6 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !form.destinationCountryCode}
            className="px-8 py-2.5 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:opacity-90 shadow-lg disabled:opacity-50"
            style={{ backgroundColor: primary }}
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {loading ? 'Creating...' : 'Create & Generate Workflow'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VisaCreatePage;

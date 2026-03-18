import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, User } from 'lucide-react';
import { leadAPI } from '../services/api';
import { useBranding } from '../context/BrandingContext';

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
const STUDY_LEVELS = [
  'certificate',
  'diploma',
  'bachelor',
  'postgraduate',
  'phd',
  'english_course',
  'other',
];
const COUNTRIES = [
  'United Kingdom',
  'United States',
  'Canada',
  'Australia',
  'Germany',
  'Ireland',
  'New Zealand',
  'France',
  'Netherlands',
  'Other',
];

const Field = ({ label, required, children }) => (
  <div>
    <label className="block text-xs font-bold text-gray-600 mb-1.5">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    {children}
  </div>
);

const Input = ({ ...props }) => (
  <input
    {...props}
    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all"
  />
);

const Select = ({ children, ...props }) => (
  <select
    {...props}
    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all"
  >
    {children}
  </select>
);

const LeadCreatePage = () => {
  const navigate = useNavigate();
  const { branding } = useBranding();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    whatsappNumber: '',
    source: 'website',
    status: 'new',
    preferredCountries: [],
    preferredStudyLevel: '',
    preferredIntake: '',
    budget: '',
    education: {
      lastDegree: '',
      institution: '',
      percentage: '',
      passingYear: '',
      gpa: '',
    },
    englishTest: { type: 'none', score: '', dateTaken: '' },
    notes_initial: '',
    tags: '',
  });

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));
  const setEd = (key, val) =>
    setForm((f) => ({ ...f, education: { ...f.education, [key]: val } }));
  const setEng = (key, val) =>
    setForm((f) => ({ ...f, englishTest: { ...f.englishTest, [key]: val } }));

  const toggleCountry = (c) => {
    setForm((f) => ({
      ...f,
      preferredCountries: f.preferredCountries.includes(c)
        ? f.preferredCountries.filter((x) => x !== c)
        : [...f.preferredCountries, c],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = {
        ...form,
        budget: form.budget ? Number(form.budget) : undefined,
        education: {
          ...form.education,
          percentage: form.education.percentage
            ? Number(form.education.percentage)
            : undefined,
          passingYear: form.education.passingYear
            ? Number(form.education.passingYear)
            : undefined,
          gpa: form.education.gpa ? Number(form.education.gpa) : undefined,
        },
        englishTest: {
          ...form.englishTest,
          score: form.englishTest.score
            ? Number(form.englishTest.score)
            : undefined,
        },
        tags: form.tags
          ? form.tags
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
      };
      if (form.notes_initial) {
        payload.notes = [{ content: form.notes_initial }];
        delete payload.notes_initial;
      }
      const res = await leadAPI.createLead(payload);
      navigate(`/admin/leads/${res.data.data.lead._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create lead');
    } finally {
      setLoading(false);
    }
  };

  const primary = branding?.primaryColor || '#6366f1';

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/admin/leads')}
          className="p-2 hover:bg-gray-100 rounded-xl transition-all"
        >
          <ArrowLeft size={18} className="text-gray-500" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-gray-800">Create Lead</h1>
          <p className="text-xs text-gray-400">
            Add a new lead to the CRM pipeline
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex-1 overflow-y-auto space-y-6 pb-6"
      >
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600 font-medium">
            {error}
          </div>
        )}

        {/* Personal Info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-black text-gray-700 mb-4 flex items-center gap-2">
            <User size={16} /> Personal Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="First Name" required>
              <Input
                required
                value={form.firstName}
                onChange={(e) => set('firstName', e.target.value)}
                placeholder="e.g. John"
              />
            </Field>
            <Field label="Last Name" required>
              <Input
                required
                value={form.lastName}
                onChange={(e) => set('lastName', e.target.value)}
                placeholder="e.g. Doe"
              />
            </Field>
            <Field label="Email Address">
              <Input
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="john.doe@gmail.com"
              />
            </Field>
            <Field label="Phone Number" required>
              <Input
                required
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="+977-XXXXXXXXXX"
              />
            </Field>
            <Field label="WhatsApp Number">
              <Input
                value={form.whatsappNumber}
                onChange={(e) => set('whatsappNumber', e.target.value)}
                placeholder="+977-XXXXXXXXXX"
              />
            </Field>
            <Field label="Lead Source">
              <Select
                value={form.source}
                onChange={(e) => set('source', e.target.value)}
              >
                {SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Tags (comma-separated)">
              <Input
                value={form.tags}
                onChange={(e) => set('tags', e.target.value)}
                placeholder="e.g. uk-bound, ielts-ready, urgent"
              />
            </Field>
            <Field label="Budget (NPR)">
              <Input
                type="number"
                value={form.budget}
                onChange={(e) => set('budget', e.target.value)}
                placeholder="e.g. 3000000"
              />
            </Field>
          </div>
        </div>

        {/* Study Preferences */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-black text-gray-700 mb-4">
            🎓 Study Preferences
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <p className="text-xs font-bold text-gray-600 mb-2">
                Preferred Countries
              </p>
              <div className="flex flex-wrap gap-2">
                {COUNTRIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleCountry(c)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      form.preferredCountries.includes(c)
                        ? 'text-white border-transparent shadow-sm'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                    style={
                      form.preferredCountries.includes(c)
                        ? { backgroundColor: primary, borderColor: primary }
                        : {}
                    }
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <Field label="Study Level">
              <Select
                value={form.preferredStudyLevel}
                onChange={(e) => set('preferredStudyLevel', e.target.value)}
              >
                <option value="">Select Level</option>
                {STUDY_LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l.charAt(0).toUpperCase() + l.slice(1).replace(/_/g, ' ')}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Preferred Intake">
              <Input
                value={form.preferredIntake}
                onChange={(e) => set('preferredIntake', e.target.value)}
                placeholder="e.g. September 2025"
              />
            </Field>
          </div>
        </div>

        {/* Education */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-black text-gray-700 mb-4">
            📚 Education Background
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Last Degree">
              <Input
                value={form.education.lastDegree}
                onChange={(e) => setEd('lastDegree', e.target.value)}
                placeholder="e.g. Higher Secondary"
              />
            </Field>
            <Field label="Institution">
              <Input
                value={form.education.institution}
                onChange={(e) => setEd('institution', e.target.value)}
                placeholder="e.g. Kathmandu University"
              />
            </Field>
            <Field label="Percentage (%)">
              <Input
                type="number"
                value={form.education.percentage}
                onChange={(e) => setEd('percentage', e.target.value)}
                placeholder="e.g. 75"
              />
            </Field>
            <Field label="Passing Year">
              <Input
                type="number"
                value={form.education.passingYear}
                onChange={(e) => setEd('passingYear', e.target.value)}
                placeholder="e.g. 2023"
              />
            </Field>
            <Field label="GPA (if applicable)">
              <Input
                type="number"
                step="0.01"
                value={form.education.gpa}
                onChange={(e) => setEd('gpa', e.target.value)}
                placeholder="e.g. 3.5"
              />
            </Field>
          </div>
        </div>

        {/* English Test */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-black text-gray-700 mb-4">
            🗣️ English Proficiency
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Test Type">
              <Select
                value={form.englishTest.type}
                onChange={(e) => setEng('type', e.target.value)}
              >
                <option value="none">None / Not yet taken</option>
                <option value="ielts">IELTS</option>
                <option value="pte">PTE Academic</option>
                <option value="toefl">TOEFL</option>
                <option value="duolingo">Duolingo English Test</option>
                <option value="cambridge">Cambridge English</option>
              </Select>
            </Field>
            {form.englishTest.type !== 'none' && (
              <>
                <Field label={`${form.englishTest.type.toUpperCase()} Score`}>
                  <Input
                    type="number"
                    step="0.5"
                    value={form.englishTest.score}
                    onChange={(e) => setEng('score', e.target.value)}
                    placeholder="e.g. 6.5"
                  />
                </Field>
                <Field label="Test Date">
                  <Input
                    type="date"
                    value={form.englishTest.dateTaken}
                    onChange={(e) => setEng('dateTaken', e.target.value)}
                  />
                </Field>
              </>
            )}
          </div>
        </div>

        {/* Initial Note */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-black text-gray-700 mb-4">
            📝 Initial Notes
          </h2>
          <textarea
            value={form.notes_initial}
            onChange={(e) => set('notes_initial', e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all resize-none"
            rows={4}
            placeholder="Add any notes about this lead..."
          />
        </div>

        {/* Submit */}
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={() => navigate('/admin/leads')}
            className="px-6 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-2.5 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:opacity-90 shadow-lg transition-all disabled:opacity-50"
            style={{ backgroundColor: primary }}
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {loading ? 'Creating...' : 'Create Lead'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LeadCreatePage;

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Mail, MapPinned, Phone, Send } from 'lucide-react';
import { publicAPI } from '@/src/services/api';
import { DEFAULT_BRANDING, normalizeBranding } from '@/src/services/branding';

const inputClassName =
  'w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500';

const splitCsv = (value) =>
  String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

export default function PublicFormPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params?.slug;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [branding, setBranding] = useState(DEFAULT_BRANDING);
  const [formMeta, setFormMeta] = useState(null);
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    mobile: '',
    preferredCountries: '',
    interestedCourse: '',
    interestedFor: '',
    courseLevel: '',
    stream: '',
    preferredLocation: '',
    notes: '',
  });

  useEffect(() => {
    let active = true;

    const loadForm = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await publicAPI.getForm(slug);
        if (!active) {
          return;
        }
        setFormMeta(response.data?.data?.form || null);
        setBranding(normalizeBranding(response.data?.data?.branding || DEFAULT_BRANDING));
      } catch (requestError) {
        if (active) {
          setError(
            requestError?.response?.data?.message ||
              requestError?.message ||
              'Failed to load public form.'
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadForm();

    return () => {
      active = false;
    };
  }, [slug]);

  const visibleFields = useMemo(
    () => new Set(formMeta?.visibleFields || []),
    [formMeta?.visibleFields]
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await publicAPI.submitForm(slug, {
        ...formState,
        preferredCountries: splitCsv(formState.preferredCountries),
        qrCodeId: searchParams.get('qr') || '',
        pageUrl: typeof window !== 'undefined' ? window.location.href : '',
      });
      setSuccessMessage(
        response.data?.data?.thankYouMessage ||
          'Thank you. Our counselling team will contact you shortly.'
      );
      setFormState({
        name: '',
        email: '',
        mobile: '',
        preferredCountries: '',
        interestedCourse: '',
        interestedFor: '',
        courseLevel: '',
        stream: '',
        preferredLocation: '',
        notes: '',
      });
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to submit form.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-4 text-sm font-medium text-slate-600 shadow-xl">
          Loading enquiry form...
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen px-4 py-10"
      style={{
        background: `linear-gradient(135deg, ${branding.secondaryColor} 0%, ${branding.primaryColor} 45%, #f8fafc 100%)`,
        fontFamily: branding.fontFamily,
      }}
    >
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_1.05fr]">
        <section className="rounded-[2rem] border border-white/10 bg-white/10 p-8 text-white backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.25em]" style={{ color: branding.accentColor }}>
            {branding.companyName}
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight">
            {formMeta?.title || formMeta?.name || 'Student enquiry'}
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-white/85">
            {formMeta?.description ||
              'Share your study preferences and our counselling team will respond with the right pathway, country, and course advice.'}
          </p>

          <div className="mt-8 grid gap-4 text-sm text-white/90">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
              <Mail className="mb-3 h-5 w-5" style={{ color: branding.accentColor }} />
              Website and QR submissions route directly into the tenant CRM with source tagging and assignment.
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
              <MapPinned className="mb-3 h-5 w-5" style={{ color: branding.accentColor }} />
              Country workflows, counsellor matching, and follow-up logic continue automatically after submission.
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_30px_80px_rgba(15,23,42,0.12)]">
          {successMessage ? (
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
              {successMessage}
            </div>
          ) : null}

          {error ? (
            <div className="mb-4 rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {[
              ['name', 'Full name'],
              ['email', 'Email'],
              ['mobile', 'Mobile number'],
              ['preferredCountries', 'Preferred countries'],
              ['interestedCourse', 'Interested course'],
              ['interestedFor', 'Interested for'],
              ['courseLevel', 'Course level'],
              ['stream', 'Stream'],
              ['preferredLocation', 'Preferred location'],
            ]
              .filter(([field]) => visibleFields.has(field) || ['name', 'email', 'mobile'].includes(field))
              .map(([field, label]) => (
                <label key={field} className="block space-y-2">
                  <span className="text-sm font-semibold text-slate-700">{label}</span>
                  <input
                    className={inputClassName}
                    value={formState[field]}
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        [field]: event.target.value,
                      }))
                    }
                  />
                </label>
              ))}

            {(visibleFields.has('notes') || !formMeta?.visibleFields?.length) ? (
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-700">Notes</span>
                <textarea
                  rows={4}
                  className={inputClassName}
                  value={formState.notes}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                />
              </label>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-950 transition disabled:opacity-60"
              style={{ backgroundColor: branding.accentColor }}
            >
              <Send className="h-4 w-4" />
              {submitting ? 'Submitting...' : 'Submit enquiry'}
            </button>
          </form>

          <div className="mt-6 flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <Phone className="h-4 w-4 text-slate-400" />
            {branding.supportEmail || 'Your CRM team will respond from this tenant workspace.'}
          </div>
        </section>
      </div>
    </div>
  );
}

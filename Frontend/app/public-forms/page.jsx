'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { QrCode, Send, Share2 } from 'lucide-react';
import AppShell from '@/components/app/app-shell';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  MetricCard,
  StatusPill,
} from '@/components/app/shared';
import { platformAPI } from '@/src/services/api';

const inputClassName =
  'w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:bg-white';

const defaultForm = {
  name: '',
  slug: '',
  title: '',
  description: '',
  visibleFields: 'name, email, mobile, preferredCountries, interestedCourse, notes',
  requiredFields: 'name, mobile',
  defaultCountry: 'Australia',
  sourceLabel: 'Website Form',
  campaignTag: '',
  targetCountries: 'Australia, UK, Canada',
  thankYouMessage: 'Thank you. Our counselling team will contact you shortly.',
  isActive: true,
};

const defaultQRForm = {
  formId: '',
  label: '',
  campaignId: '',
  targetCountries: '',
};

export default function PublicFormsPage() {
  const [loading, setLoading] = useState(true);
  const [savingForm, setSavingForm] = useState(false);
  const [savingQR, setSavingQR] = useState(false);
  const [error, setError] = useState('');
  const [forms, setForms] = useState([]);
  const [qrCodes, setQRCodes] = useState([]);
  const [formState, setFormState] = useState(defaultForm);
  const [qrState, setQrState] = useState(defaultQRForm);

  const loadWorkspace = async () => {
    setLoading(true);
    setError('');
    try {
      const [formsResponse, qrResponse] = await Promise.allSettled([
        platformAPI.getForms(),
        platformAPI.getQRCodes(),
      ]);
      setForms(
        formsResponse.status === 'fulfilled' ? formsResponse.value.data?.data?.forms || [] : []
      );
      setQRCodes(
        qrResponse.status === 'fulfilled' ? qrResponse.value.data?.data?.qrCodes || [] : []
      );
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to load public forms workspace.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspace();
  }, []);

  const cards = useMemo(
    () => [
      {
        label: 'Hosted Forms',
        value: forms.length,
        helper: 'Tenant-branded public capture endpoints',
        icon: Share2,
        accent: 'bg-slate-900',
      },
      {
        label: 'QR Campaigns',
        value: qrCodes.length,
        helper: 'Event and branch lead capture',
        icon: QrCode,
        accent: 'bg-teal-600',
      },
    ],
    [forms.length, qrCodes.length]
  );

  const handleSaveForm = async (event) => {
    event.preventDefault();
    setSavingForm(true);
    setError('');

    try {
      await platformAPI.saveForm(formState);
      setFormState(defaultForm);
      await loadWorkspace();
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to save public form.'
      );
    } finally {
      setSavingForm(false);
    }
  };

  const handleGenerateQR = async (event) => {
    event.preventDefault();
    setSavingQR(true);
    setError('');

    try {
      await platformAPI.createQRCode(qrState);
      setQrState(defaultQRForm);
      await loadWorkspace();
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to generate QR code.'
      );
    } finally {
      setSavingQR(false);
    }
  };

  return (
    <AppShell
      title="Public Forms"
      description="Build hosted enquiry forms, distribute QR capture links, and route submissions into the tenant-safe CRM pipeline with analytics and branding."
    >
      {loading ? <LoadingState label="Loading public forms..." /> : null}
      {!loading ? (
        <div className="space-y-6">
          {error ? <ErrorState message={error} onRetry={loadWorkspace} /> : null}

          <div className="grid gap-4 xl:grid-cols-2">
            {cards.map((card) => (
              <MetricCard
                key={card.label}
                label={card.label}
                value={card.value}
                helper={card.helper}
                icon={card.icon}
                accent={card.accent}
              />
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <form className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm" onSubmit={handleSaveForm}>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Form Builder
                </p>
                <h3 className="mt-2 text-xl font-semibold text-slate-900">
                  Hosted enquiry form
                </h3>
              </div>

              {[
                ['name', 'Form name'],
                ['slug', 'Slug'],
                ['title', 'Public title'],
                ['description', 'Description'],
                ['defaultCountry', 'Default country'],
                ['sourceLabel', 'Source label'],
                ['campaignTag', 'Campaign tag'],
                ['targetCountries', 'Target countries'],
                ['visibleFields', 'Visible fields'],
                ['requiredFields', 'Required fields'],
              ].map(([field, label]) => (
                <label key={field} className="block space-y-2">
                  <span className="text-sm font-semibold text-slate-700">{label}</span>
                  {field === 'description' ? (
                    <textarea
                      rows={3}
                      className={inputClassName}
                      value={formState[field]}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          [field]: event.target.value,
                        }))
                      }
                    />
                  ) : (
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
                  )}
                </label>
              ))}

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-700">Thank you message</span>
                <textarea
                  rows={3}
                  className={inputClassName}
                  value={formState.thankYouMessage}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      thankYouMessage: event.target.value,
                    }))
                  }
                />
              </label>

              <button
                type="submit"
                disabled={savingForm}
                className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
              >
                {savingForm ? 'Saving...' : 'Save Public Form'}
              </button>
            </form>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Published Forms
              </p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">
                Live hosted URLs
              </h3>
              <div className="mt-6 space-y-4">
                {forms.length ? (
                  forms.map((form) => (
                    <div key={form._id} className="rounded-3xl border border-slate-200 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">{form.name}</p>
                          <p className="mt-1 text-sm text-slate-500">{form.title || form.slug}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <StatusPill tone={form.isActive ? 'completed' : 'lost'}>
                            {form.isActive ? 'Active' : 'Inactive'}
                          </StatusPill>
                          <StatusPill tone="pending">{form.analytics?.submissions || 0} submissions</StatusPill>
                        </div>
                      </div>
                      <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                        <p className="font-semibold">Hosted path</p>
                        <p className="mt-2 break-all">{`/forms/${form.slug}`}</p>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <Link
                          href={`/forms/${form.slug}`}
                          target="_blank"
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          <Send className="h-4 w-4" />
                          Open hosted form
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState
                    icon={Share2}
                    title="No hosted forms yet"
                    description="Create a branded enquiry form for your website, branch landing pages, or campaign flows."
                  />
                )}
              </div>
            </section>
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
            <form className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm" onSubmit={handleGenerateQR}>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  QR Generator
                </p>
                <h3 className="mt-2 text-xl font-semibold text-slate-900">
                  Event and branch capture
                </h3>
              </div>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-700">Public form</span>
                <select
                  className={inputClassName}
                  value={qrState.formId}
                  onChange={(event) =>
                    setQrState((current) => ({
                      ...current,
                      formId: event.target.value,
                    }))
                  }
                >
                  <option value="">Select form</option>
                  {forms.map((form) => (
                    <option key={form._id} value={form._id}>
                      {form.name}
                    </option>
                  ))}
                </select>
              </label>

              {[
                ['label', 'QR label'],
                ['campaignId', 'Campaign ID'],
                ['targetCountries', 'Target countries'],
              ].map(([field, label]) => (
                <label key={field} className="block space-y-2">
                  <span className="text-sm font-semibold text-slate-700">{label}</span>
                  <input
                    className={inputClassName}
                    value={qrState[field]}
                    onChange={(event) =>
                      setQrState((current) => ({
                        ...current,
                        [field]: event.target.value,
                      }))
                    }
                  />
                </label>
              ))}

              <button
                type="submit"
                disabled={savingQR}
                className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
              >
                {savingQR ? 'Generating...' : 'Generate QR Code'}
              </button>
            </form>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                QR Campaigns
              </p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">
                Download and distribute
              </h3>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {qrCodes.length ? (
                  qrCodes.map((qrCode) => (
                    <div key={qrCode._id} className="rounded-3xl border border-slate-200 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">{qrCode.label}</p>
                          <p className="mt-1 text-sm text-slate-500">
                            {qrCode.formId?.name || 'Public form'}
                          </p>
                        </div>
                        <StatusPill tone={qrCode.isActive ? 'completed' : 'lost'}>
                          {qrCode.isActive ? 'Active' : 'Inactive'}
                        </StatusPill>
                      </div>
                      {qrCode.imageUrl ? (
                        <Image
                          src={qrCode.imageUrl}
                          alt={qrCode.label}
                          width={160}
                          height={160}
                          unoptimized
                          className="mx-auto mt-4 h-40 w-40 rounded-2xl border border-slate-200 bg-white p-3"
                        />
                      ) : null}
                      <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                        <span>{qrCode.scanCount || 0} scans</span>
                        <span>{qrCode.submissionCount || 0} submissions</span>
                      </div>
                      <a
                        href={qrCode.imageUrl}
                        download={`${qrCode.label || 'qr-code'}.png`}
                        className="mt-4 inline-flex rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Download QR
                      </a>
                    </div>
                  ))
                ) : (
                  <EmptyState
                    icon={QrCode}
                    title="No QR campaigns yet"
                    description="Generate branded QR codes for events, branch counters, and offline marketing campaigns."
                  />
                )}
              </div>
            </section>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}

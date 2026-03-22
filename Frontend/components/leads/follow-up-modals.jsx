'use client';

import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';

const FOLLOW_UP_METHODS = [
  { value: 'call', label: 'Call' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'Email' },
  { value: 'in_person', label: 'In-person' },
  { value: 'other', label: 'Other' },
];

const OUTCOME_TYPES = [
  { value: 'next_followup_needed', label: 'Next Follow-up Needed' },
  { value: 'converted_to_student', label: 'Convert to Student' },
  { value: 'closed_not_interested', label: 'Closed / Not Interested' },
  { value: 'no_response', label: 'No Response' },
  { value: 'other', label: 'Other' },
];

const overlayClassName =
  'fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm';

const panelClassName =
  'w-full max-w-2xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.18)]';

const inputClassName = 'ds-field w-full';

function ModalFrame({ title, description, onClose, children }) {
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div className={overlayClassName}>
      <div className={panelClassName}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-slate-950">{title}</h3>
            {description ? <p className="mt-2 text-sm text-slate-500">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ds-button-ghost rounded-2xl p-2 text-slate-500"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, required, children, hint }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-slate-700">
        {label} {required ? <span className="text-rose-500">*</span> : null}
      </span>
      {children}
      {hint ? <span className="block text-xs text-slate-500">{hint}</span> : null}
    </label>
  );
}

export function ScheduleFollowUpModal({
  open,
  leadName,
  onClose,
  onSubmit,
  submitting = false,
  initialValue,
}) {
  const [form, setForm] = useState({
    scheduledAt: '',
    type: 'call',
    notes: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setForm({
        scheduledAt: initialValue?.scheduledAt || '',
        type: initialValue?.type || 'call',
        notes: initialValue?.notes || '',
      });
      setError('');
    }
  }, [initialValue, open]);

  if (!open) {
    return null;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.scheduledAt) {
      setError('Follow-up date and time is required.');
      return;
    }

    setError('');
    await onSubmit?.(form);
  };

  return (
    <ModalFrame
      title="Schedule Follow-up"
      description={leadName ? `Set the next touchpoint for ${leadName}.` : 'Set the next follow-up.'}
      onClose={onClose}
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Date & Time" required>
            <input
              type="datetime-local"
              value={form.scheduledAt}
              onChange={(event) => setForm((current) => ({ ...current, scheduledAt: event.target.value }))}
              className={inputClassName}
            />
          </Field>
          <Field label="Method">
            <select
              value={form.type}
              onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}
              className={inputClassName}
            >
              {FOLLOW_UP_METHODS.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Notes">
          <textarea
            rows={4}
            value={form.notes}
            onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
            className={inputClassName}
            placeholder="Add context for the upcoming conversation."
          />
        </Field>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="ds-button-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="ds-button-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Saving...' : 'Schedule Follow-up'}
          </button>
        </div>
      </form>
    </ModalFrame>
  );
}

export function CompleteFollowUpModal({
  open,
  followUp,
  leadName,
  counsellorName,
  onClose,
  onSubmit,
  submitting = false,
}) {
  const [form, setForm] = useState({
    outcomeType: 'next_followup_needed',
    notes: '',
    nextFollowUpDate: '',
    followUpMethod: 'call',
    followUpTime: '',
  });
  const [error, setError] = useState('');

  const defaultMethod = useMemo(() => followUp?.type || 'call', [followUp?.type]);

  useEffect(() => {
    if (open) {
      setForm({
        outcomeType: 'next_followup_needed',
        notes: '',
        nextFollowUpDate: '',
        followUpMethod: defaultMethod,
        followUpTime: '',
      });
      setError('');
    }
  }, [defaultMethod, open]);

  if (!open || !followUp) {
    return null;
  }

  const requiresNextDate = form.outcomeType === 'next_followup_needed';

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.notes.trim()) {
      setError('Notes are required before completing a follow-up.');
      return;
    }

    if (requiresNextDate && !form.nextFollowUpDate) {
      setError('Next follow-up date is required for this outcome.');
      return;
    }

    setError('');
    await onSubmit?.(form);
  };

  return (
    <ModalFrame
      title="Complete Follow-up"
      description={
        leadName
          ? `Record the outcome for ${leadName}. Completing a follow-up always requires notes.`
          : 'Record the follow-up outcome.'
      }
      onClose={onClose}
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="grid gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Scheduled</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">
              {new Date(followUp.scheduledAt).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Current Method</p>
            <p className="mt-2 text-sm font-semibold capitalize text-slate-900">
              {String(followUp.type || 'call').replace(/_/g, ' ')}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Counsellor</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">{counsellorName || 'Auto-filled'}</p>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Outcome Type" required>
            <select
              value={form.outcomeType}
              onChange={(event) => setForm((current) => ({ ...current, outcomeType: event.target.value }))}
              className={inputClassName}
            >
              {OUTCOME_TYPES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Follow-up Method">
            <select
              value={form.followUpMethod}
              onChange={(event) => setForm((current) => ({ ...current, followUpMethod: event.target.value }))}
              className={inputClassName}
            >
              {FOLLOW_UP_METHODS.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label="Next Follow-up Date"
            required={requiresNextDate}
            hint={requiresNextDate ? 'Required when the outcome is Next Follow-up Needed.' : ''}
          >
            <input
              type="datetime-local"
              value={form.nextFollowUpDate}
              onChange={(event) => setForm((current) => ({ ...current, nextFollowUpDate: event.target.value }))}
              className={inputClassName}
            />
          </Field>
          <Field label="Follow-up Time">
            <input
              type="time"
              value={form.followUpTime}
              onChange={(event) => setForm((current) => ({ ...current, followUpTime: event.target.value }))}
              className={inputClassName}
            />
          </Field>
        </div>

        <Field label="Notes / Remarks" required>
          <textarea
            rows={5}
            value={form.notes}
            onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
            className={inputClassName}
            placeholder="Document what happened, what was discussed, and what should happen next."
          />
        </Field>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="ds-button-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="ds-button-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Saving...' : 'Complete Follow-up'}
          </button>
        </div>
      </form>
    </ModalFrame>
  );
}

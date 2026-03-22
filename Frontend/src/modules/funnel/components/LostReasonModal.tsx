'use client';

import { useEffect, useState } from 'react';

type LostReasonModalProps = {
  open: boolean;
  initialValue?: any;
  onClose: () => void;
  onSubmit: (payload: any) => Promise<void> | void;
  submitting?: boolean;
};

export default function LostReasonModal({
  open,
  initialValue = null,
  onClose,
  onSubmit,
  submitting = false,
}: LostReasonModalProps) {
  const [form, setForm] = useState({
    id: '',
    label: '',
    active: true,
  });

  useEffect(() => {
    if (open) {
      setForm({
        id: initialValue?._id || initialValue?.id || '',
        label: initialValue?.label || '',
        active: initialValue?.active !== false,
      });
    }
  }, [initialValue, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[2rem] border border-white/20 bg-white p-6 shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Lost Reason
        </p>
        <h3 className="mt-2 text-2xl font-semibold text-slate-950">
          {form.id ? 'Edit lost reason' : 'Add lost reason'}
        </h3>

        <label className="mt-6 block space-y-2">
          <span className="text-sm font-semibold text-slate-700">Label</span>
          <input
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white"
            value={form.label}
            onChange={(event) => setForm((current) => ({ ...current, label: event.target.value }))}
            placeholder="Budget mismatch"
          />
        </label>

        <label className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked }))}
          />
          Active reason
        </label>

        <div className="mt-6 flex justify-end gap-3">
          <button
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={submitting || !form.label.trim()}
            onClick={() => onSubmit(form)}
            type="button"
          >
            Save reason
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';

type StageMoveModalProps = {
  open: boolean;
  lead: any;
  targetStage: any;
  lostReasons?: any[];
  onClose: () => void;
  onSubmit: (payload: any) => Promise<void> | void;
  submitting?: boolean;
};

export default function StageMoveModal({
  open,
  lead,
  targetStage,
  lostReasons = [],
  onClose,
  onSubmit,
  submitting = false,
}: StageMoveModalProps) {
  const [form, setForm] = useState({
    reason: '',
    notes: '',
    followUpAt: '',
    lostReasonId: '',
    lostReasonLabel: '',
  });

  useEffect(() => {
    if (!open) {
      setForm({
        reason: '',
        notes: '',
        followUpAt: '',
        lostReasonId: '',
        lostReasonLabel: '',
      });
    }
  }, [open]);

  if (!open || !targetStage) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-[2rem] border border-white/20 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Move Through Funnel
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-950">
              Move {lead?.name || lead?.firstName || 'lead'} to {targetStage?.name}
            </h3>
          </div>
          <button
            className="rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-700">Movement reason</span>
            <input
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white"
              placeholder="Why is this stage changing?"
              value={form.reason}
              onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-700">Next follow-up</span>
            <input
              type="datetime-local"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white"
              value={form.followUpAt}
              onChange={(event) => setForm((current) => ({ ...current, followUpAt: event.target.value }))}
            />
          </label>
        </div>

        {targetStage?.isLost ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-700">Lost reason</span>
              <select
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white"
                value={form.lostReasonId}
                onChange={(event) => setForm((current) => ({ ...current, lostReasonId: event.target.value }))}
              >
                <option value="">Select lost reason</option>
                {lostReasons.map((reason) => (
                  <option key={reason._id} value={reason._id}>
                    {reason.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-700">Custom lost note</span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white"
                placeholder="Optional custom detail"
                value={form.lostReasonLabel}
                onChange={(event) => setForm((current) => ({ ...current, lostReasonLabel: event.target.value }))}
              />
            </label>
          </div>
        ) : null}

        <label className="mt-4 block space-y-2">
          <span className="text-sm font-semibold text-slate-700">Notes</span>
          <textarea
            rows={5}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white"
            placeholder="Add context for audit history and future operators."
            value={form.notes}
            onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
          />
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
            disabled={submitting}
            onClick={() => onSubmit(form)}
            type="button"
          >
            Confirm move
          </button>
        </div>
      </div>
    </div>
  );
}

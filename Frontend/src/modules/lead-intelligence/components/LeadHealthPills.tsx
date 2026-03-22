'use client';

const TONE_STYLES: Record<string, string> = {
  high_intent: 'bg-emerald-100 text-emerald-700',
  hot: 'bg-orange-100 text-orange-700',
  warm: 'bg-amber-100 text-amber-700',
  warming: 'bg-lime-100 text-lime-700',
  cold: 'bg-slate-100 text-slate-700',
  cooling: 'bg-cyan-100 text-cyan-700',
  at_risk: 'bg-rose-100 text-rose-700',
  urgent: 'bg-rose-100 text-rose-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-sky-100 text-sky-700',
  low: 'bg-slate-100 text-slate-700',
  stale: 'bg-fuchsia-100 text-fuchsia-700',
  reactivation_candidate: 'bg-violet-100 text-violet-700',
};

const formatLabel = (value: string) =>
  String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());

type LeadHealthPillsProps = {
  score?: number;
  label?: string;
  temperature?: string;
  priority?: string;
  nextAction?: string;
};

function Pill({ value }: { value: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        TONE_STYLES[value] || 'bg-slate-100 text-slate-700'
      }`}
    >
      {formatLabel(value)}
    </span>
  );
}

export default function LeadHealthPills({
  score = 0,
  label = '',
  temperature = '',
  priority = '',
  nextAction = '',
}: LeadHealthPillsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
        AI {Math.round(Number(score || 0))}
      </span>
      {label ? <Pill value={label} /> : null}
      {temperature ? <Pill value={temperature} /> : null}
      {priority ? <Pill value={priority} /> : null}
      {nextAction ? (
        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          {nextAction}
        </span>
      ) : null}
    </div>
  );
}

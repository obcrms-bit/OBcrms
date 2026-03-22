import { cn } from '@/lib/utils';

type OwnerStatusBadgeProps = {
  label: string;
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
};

const toneClasses: Record<NonNullable<OwnerStatusBadgeProps['tone']>, string> = {
  neutral: 'border-slate-200 bg-slate-100 text-slate-700',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  danger: 'border-rose-200 bg-rose-50 text-rose-700',
  info: 'border-sky-200 bg-sky-50 text-sky-700',
};

export default function OwnerStatusBadge({
  label,
  tone = 'neutral',
  className,
}: OwnerStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold tracking-[0.16em] uppercase',
        toneClasses[tone],
        className
      )}
    >
      {label}
    </span>
  );
}

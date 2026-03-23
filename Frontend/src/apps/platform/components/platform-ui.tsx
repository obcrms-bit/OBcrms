'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Inbox,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatRelativeDate } from '../platform.utils';

export type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const toneClasses: Record<Tone, string> = {
  success:
    'border-emerald-200/80 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300',
  warning:
    'border-amber-200/80 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300',
  danger:
    'border-rose-200/80 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300',
  info:
    'border-sky-200/80 bg-sky-50 text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300',
  neutral:
    'border-slate-200/80 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

const surfaceClassName =
  'rounded-[28px] border border-slate-200/80 bg-white/95 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur transition dark:border-slate-800 dark:bg-slate-950/85 dark:shadow-[0_24px_70px_rgba(2,6,23,0.45)]';

export function PageHeading({
  eyebrow = 'Platform Console',
  title,
  subtitle,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: 'easeOut' }}
      className={cn(surfaceClassName, 'relative overflow-hidden px-6 py-7 md:px-8 md:py-8')}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.98),rgba(248,250,252,0.86))] dark:bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_30%),linear-gradient(135deg,rgba(15,23,42,0.92),rgba(2,6,23,0.86))]" />
      <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-4xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-sky-700 dark:text-sky-300">
            {eyebrow}
          </p>
          <h1 className="mt-3 text-[clamp(2rem,1.3rem+1.6vw,3.15rem)] font-semibold tracking-[-0.04em] text-slate-950 dark:text-slate-50">
            {title}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">
            {subtitle}
          </p>
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
      </div>
    </motion.section>
  );
}

export function HeroCommandPanel({
  title,
  subtitle,
  eyebrow = 'Super Admin Console',
  roleLabel,
  actions,
  insights,
}: {
  title: string;
  subtitle: string;
  eyebrow?: string;
  roleLabel: string;
  actions?: React.ReactNode;
  insights: Array<{
    id: string;
    label: string;
    value: string;
    helper: string;
    tone?: Tone | 'healthy' | 'watch' | 'critical';
  }>;
}) {
  return (
    <section className="overflow-hidden rounded-[30px] border border-slate-200/80 bg-[linear-gradient(135deg,#020617_0%,#0f172a_42%,#1e3a8a_100%)] px-6 py-6 text-white shadow-[0_30px_80px_rgba(15,23,42,0.24)]">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-100">
              {eyebrow}
            </span>
            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-200">
              {roleLabel}
            </span>
          </div>
          <h2 className="mt-4 text-[clamp(2rem,1.4rem+1.6vw,3.1rem)] font-semibold tracking-[-0.05em]">
            {title}
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200/80">{subtitle}</p>
          {actions ? <div className="mt-6 flex flex-wrap gap-3">{actions}</div> : null}
        </div>
        <div className="grid w-full gap-3 sm:grid-cols-3 xl:max-w-[560px]">
          {insights.map((insight) => (
            <div
              key={insight.id}
              className="rounded-[24px] border border-white/10 bg-white/10 px-4 py-4 backdrop-blur"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                {insight.label}
              </p>
              <p className="mt-3 text-2xl font-semibold tracking-[-0.04em]">{insight.value}</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">{insight.helper}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function StatusBadge({
  label,
  tone = 'neutral',
  className,
}: {
  label: string;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]',
        toneClasses[tone],
        className
      )}
    >
      {label}
    </span>
  );
}

export function ProgressBar({
  value,
  tone = 'info',
  className,
}: {
  value: number;
  tone?: Tone;
  className?: string;
}) {
  const width = Math.max(0, Math.min(100, value));
  const toneFill =
    tone === 'success'
      ? 'bg-emerald-500'
      : tone === 'warning'
        ? 'bg-amber-500'
        : tone === 'danger'
          ? 'bg-rose-500'
          : tone === 'info'
            ? 'bg-sky-500'
            : 'bg-slate-400';

  return (
    <div
      className={cn(
        'relative h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800',
        className
      )}
    >
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${width}%` }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={cn('absolute inset-y-0 left-0 rounded-full', toneFill)}
      />
    </div>
  );
}

type KpiCardProps = {
  label: string;
  value: string | number;
  helper: string;
  icon: any;
  tone?: Tone;
  trailing?: React.ReactNode;
  trend?: string;
  href?: string;
  onClick?: () => void;
};

export function KpiCard({
  label,
  value,
  helper,
  icon: Icon,
  tone = 'neutral',
  trailing,
  trend,
  href,
  onClick,
}: KpiCardProps) {
  const iconTone =
    tone === 'success'
      ? 'bg-emerald-500/12 text-emerald-600 dark:bg-emerald-500/18 dark:text-emerald-300'
      : tone === 'warning'
        ? 'bg-amber-500/12 text-amber-600 dark:bg-amber-500/18 dark:text-amber-300'
        : tone === 'danger'
          ? 'bg-rose-500/12 text-rose-600 dark:bg-rose-500/18 dark:text-rose-300'
          : tone === 'info'
            ? 'bg-sky-500/12 text-sky-600 dark:bg-sky-500/18 dark:text-sky-300'
            : 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950';

  const content = (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className={cn(surfaceClassName, 'px-5 py-5')}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <p className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-slate-950 dark:text-slate-50">
            {value}
          </p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{helper}</p>
          {trend ? (
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700 dark:text-sky-300">
              {trend}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className={cn('flex h-12 w-12 items-center justify-center rounded-2xl', iconTone)}>
            <Icon className="h-5 w-5" />
          </div>
          {trailing}
        </div>
      </div>
    </motion.article>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="block w-full text-left">
        {content}
      </button>
    );
  }

  return content;
}

export function QuickActionCard({
  label,
  description,
  icon: Icon,
  href,
  onClick,
}: {
  label: string;
  description: string;
  icon: any;
  href?: string;
  onClick?: () => void;
}) {
  const content = (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className={cn(
        surfaceClassName,
        'group flex h-full items-start justify-between gap-4 px-5 py-5 hover:border-slate-300 dark:hover:border-slate-700'
      )}
    >
      <div className="min-w-0">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white dark:bg-slate-100 dark:text-slate-950">
          <Icon className="h-5 w-5" />
        </div>
        <p className="mt-4 text-base font-semibold text-slate-950 dark:text-slate-50">{label}</p>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
          {description}
        </p>
      </div>
      <ArrowUpRight className="mt-1 h-5 w-5 text-slate-400 transition group-hover:text-slate-700 dark:group-hover:text-slate-200" />
    </motion.div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className="block w-full text-left">
      {content}
    </button>
  );
}

export function InsightCard({
  title,
  description,
  severity = 'info',
  actionLabel,
  href,
  meta,
}: {
  title: string;
  description: string;
  severity?: 'positive' | 'watch' | 'critical' | 'info';
  actionLabel?: string;
  href?: string;
  meta?: string;
}) {
  const tone =
    severity === 'positive'
      ? toneClasses.success
      : severity === 'watch'
        ? toneClasses.warning
        : severity === 'critical'
          ? toneClasses.danger
          : toneClasses.info;

  return (
    <div className={cn('rounded-[24px] border px-5 py-5', tone)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{title}</p>
          <p className="mt-2 text-sm leading-6 opacity-90">{description}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/60 text-current dark:bg-slate-950/20">
          <Sparkles className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-80">{meta}</p>
        {href && actionLabel ? (
          <Link href={href} className="inline-flex items-center gap-2 text-sm font-semibold">
            {actionLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        ) : null}
      </div>
    </div>
  );
}

export function ChartCard({
  eyebrow,
  title,
  subtitle,
  badge,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(surfaceClassName, 'px-5 py-5')}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
            {eyebrow}
          </p>
          <h3 className="mt-2 text-lg font-semibold text-slate-950 dark:text-slate-50">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>
        {badge}
      </div>
      <div className="mt-6">{children}</div>
      {footer ? (
        <div className="mt-5 border-t border-slate-200/80 pt-4 dark:border-slate-800">{footer}</div>
      ) : null}
    </motion.section>
  );
}

export function AttentionPanel({
  items,
  title = 'Needs attention',
  subtitle = 'The issues most likely to affect activation, billing, or owner confidence.',
}: {
  items: Array<{
    id: string;
    tenantName: string;
    label: string;
    message: string;
    level: Tone | 'critical';
  }>;
  title?: string;
  subtitle?: string;
}) {
  const resolvedItems = items.slice(0, 6);

  return (
    <section className={cn(surfaceClassName, 'px-5 py-5')}>
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/12 text-amber-600 dark:bg-amber-500/18 dark:text-amber-300">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
            Attention Panel
          </p>
          <h3 className="mt-2 text-lg font-semibold text-slate-950 dark:text-slate-50">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>
      </div>
      <div className="mt-6 space-y-3">
        {resolvedItems.length ? (
          resolvedItems.map((item) => (
            <div
              key={item.id}
              className="rounded-[22px] border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/70"
            >
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge
                  label={item.label}
                  tone={
                    item.level === 'critical'
                      ? 'danger'
                      : item.level === 'warning'
                        ? 'warning'
                        : item.level === 'success'
                          ? 'success'
                          : 'info'
                  }
                />
                <p className="text-sm font-semibold text-slate-950 dark:text-slate-100">
                  {item.tenantName}
                </p>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
                {item.message}
              </p>
            </div>
          ))
        ) : (
          <EmptyResultsState
            title="No urgent issues"
            description="Platform-level alerts will appear here as soon as something needs owner action."
            compact
          />
        )}
      </div>
    </section>
  );
}

export function EmptyResultsState({
  title,
  description,
  action,
  compact = false,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-[24px] border border-dashed border-slate-300 bg-white/70 px-5 py-10 text-center dark:border-slate-700 dark:bg-slate-950/40',
        compact && 'px-4 py-6'
      )}
    >
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-400">
        <Inbox className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-slate-950 dark:text-slate-50">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">
        {description}
      </p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className={cn(surfaceClassName, 'overflow-hidden')}>
      <div className="border-b border-slate-200/80 px-5 py-4 dark:border-slate-800">
        <div className="h-4 w-44 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-900">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={`tenant-row-skeleton-${index}`} className="grid grid-cols-12 gap-4 px-5 py-4">
            {Array.from({ length: 8 }).map((__, columnIndex) => (
              <div
                key={`tenant-row-skeleton-${index}-${columnIndex}`}
                className="col-span-1 h-4 animate-pulse rounded-full bg-slate-100 dark:bg-slate-900"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ActivityList({
  items,
}: {
  items: Array<{
    id: string;
    title: string;
    description: string;
    timestamp: string;
    actor: string;
    status?: string;
  }>;
}) {
  return (
    <div className="space-y-3">
      {items.length ? (
        items.map((item) => (
          <div
            key={item.id}
            className="rounded-[22px] border border-slate-200/80 bg-slate-50/85 p-4 dark:border-slate-800 dark:bg-slate-900/70"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-semibold text-slate-950 dark:text-slate-50">{item.title}</p>
              {item.status ? <StatusBadge label={item.status} tone="neutral" /> : null}
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              {item.description}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-400 dark:text-slate-500">
              <span>{item.actor}</span>
              <span>/</span>
              <span>{formatRelativeDate(item.timestamp)}</span>
            </div>
          </div>
        ))
      ) : (
        <EmptyResultsState
          title="No recent owner activity"
          description="Audit and onboarding updates will appear here once the platform starts receiving actions."
          compact
        />
      )}
    </div>
  );
}

export function LoadingPanel({ label }: { label: string }) {
  return (
    <div className={cn(surfaceClassName, 'flex min-h-[220px] items-center justify-center px-6 py-10')}>
      <div className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
        <Loader2 className="h-4 w-4 animate-spin" />
        {label}
      </div>
    </div>
  );
}

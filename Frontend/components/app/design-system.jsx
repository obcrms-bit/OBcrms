'use client';

import { cn } from '@/lib/utils';

/**
 * @param {{
 *   eyebrow?: any;
 *   title: any;
 *   description?: any;
 *   aside?: any;
 *   children?: any;
 *   className?: string;
 * }} props
 */
export function PageHero({
  eyebrow,
  title,
  description,
  aside,
  children,
  className = '',
}) {
  return (
    <section className={cn('ds-page-hero', className)}>
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          {eyebrow ? <p className="ds-eyebrow">{eyebrow}</p> : null}
          <h1 className="ds-title">{title}</h1>
          {description ? <p className="ds-copy">{description}</p> : null}
          {children ? <div className="mt-5">{children}</div> : null}
        </div>
        {aside ? <div className="w-full max-w-xl">{aside}</div> : null}
      </div>
    </section>
  );
}

/**
 * @param {{ className?: string; children: any; tone?: string; [key: string]: any }} props
 */
export function SectionCard({ className = '', children, tone = 'default', ...props }) {
  const toneClassName =
    tone === 'muted'
      ? 'ds-surface-muted'
      : tone === 'accent'
        ? 'ds-surface-accent'
        : 'ds-surface';

  return (
    <section className={cn(toneClassName, className)} {...props}>
      {children}
    </section>
  );
}

/**
 * @param {{
 *   eyebrow?: any;
 *   title: any;
 *   description?: any;
 *   actions?: any;
 *   className?: string;
 * }} props
 */
export function SectionHeader({
  eyebrow,
  title,
  description,
  actions = null,
  className = '',
}) {
  return (
    <div className={cn('ds-section-header', className)}>
      <div className="min-w-0">
        {eyebrow ? <p className="ds-eyebrow">{eyebrow}</p> : null}
        <h2 className="ds-section-title">{title}</h2>
        {description ? <p className="ds-section-copy">{description}</p> : null}
      </div>
      {actions ? <div className="ds-action-row">{actions}</div> : null}
    </div>
  );
}

/**
 * @param {{ className?: string; children: any }} props
 */
export function FilterToolbar({ className = '', children }) {
  return (
    <section className={cn('ds-filter-bar', className)}>
      <div className="ds-filter-grid">{children}</div>
    </section>
  );
}

/**
 * @param {{ className?: string; children: any }} props
 */
export function DataTableSurface({ className = '', children }) {
  return <section className={cn('ds-surface', className)}>{children}</section>;
}

/**
 * @param {{ items?: any[]; className?: string; columns?: number }} props
 */
export function InlineStats({ items = [], className = '', columns = 4 }) {
  const columnClassName =
    columns === 2
      ? 'grid gap-4 md:grid-cols-2'
      : columns === 3
        ? 'grid gap-4 md:grid-cols-2 xl:grid-cols-3'
        : 'ds-inline-stat-grid';

  return (
    <div className={cn(columnClassName, className)}>
      {items.map((item) => (
        <article key={item.label} className="ds-stat-block">
          <p className="ds-stat-label">{item.label}</p>
          <p className="ds-stat-value">{item.value}</p>
          {item.helper ? <p className="mt-2 text-sm text-slate-500">{item.helper}</p> : null}
        </article>
      ))}
    </div>
  );
}

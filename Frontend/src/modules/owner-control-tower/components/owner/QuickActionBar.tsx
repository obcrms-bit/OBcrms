import Link from 'next/link';
import { ArrowRight, FileSpreadsheet, GitCompareArrows, Plus, Sparkles } from 'lucide-react';
import { SectionCard, SectionHeader } from '@/components/app/design-system';

const actions = [
  {
    href: '/owner-control-tower/consultancies/new',
    icon: Plus,
    title: 'Add Consultancy',
    description: 'Create a consultancy manually with owner-approved defaults and setup presets.',
  },
  {
    href: '/owner-control-tower/imports/new',
    icon: FileSpreadsheet,
    title: 'Import Consultancy File',
    description: 'Run the structured spreadsheet onboarding workflow and validate each section.',
  },
  {
    href: '/owner-control-tower/consultancies',
    icon: GitCompareArrows,
    title: 'Compare Portfolio',
    description: 'Compare conversion, visa success, revenue, and branch growth across consultancies.',
  },
];

export default function QuickActionBar() {
  return (
    <SectionCard tone="accent">
      <SectionHeader
        eyebrow="Owner Actions"
        title="High-leverage actions from one command layer"
        description="Kick off the most common owner workflows without leaving the control tower."
      />
      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        {actions.map((action, index) => (
          <Link
            key={action.href}
            href={action.href}
            className="group rounded-[1.6rem] border border-white/70 bg-white/85 p-5 shadow-[var(--ds-shadow-soft)] transition hover:-translate-y-0.5 hover:shadow-[var(--ds-shadow-medium)]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
              <action.icon className="h-5 w-5" />
            </div>
            <div className="mt-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-slate-950">{action.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{action.description}</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition group-hover:bg-slate-900 group-hover:text-white">
                {index === 1 ? <Sparkles className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </SectionCard>
  );
}

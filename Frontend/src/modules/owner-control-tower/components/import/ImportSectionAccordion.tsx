'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { ImportSectionValidation } from '../../types/owner-control.types';
import ValidationResultCard from './ValidationResultCard';

export default function ImportSectionAccordion({
  sections,
}: {
  sections: ImportSectionValidation[];
}) {
  const [openKey, setOpenKey] = useState<string | null>(sections[0]?.key || null);

  return (
    <div className="space-y-3">
      {sections.map((section) => {
        const open = openKey === section.key;
        return (
          <div key={section.key} className="rounded-[1.4rem] border border-slate-200 bg-white">
            <button
              type="button"
              onClick={() => setOpenKey(open ? null : section.key)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
            >
              <div className="min-w-0">
                <p className="font-semibold text-slate-950">{section.label}</p>
                <p className="mt-1 text-sm text-slate-500">{section.summary}</p>
              </div>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-slate-500 transition ${open ? 'rotate-180' : ''}`}
              />
            </button>
            {open ? (
              <div className="border-t border-slate-200 px-5 py-4">
                <ValidationResultCard section={section} />
                {section.issues.length ? (
                  <div className="mt-4 space-y-3">
                    {section.issues.map((issue) => (
                      <div
                        key={issue.id}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          <span>{issue.severity}</span>
                          {issue.row ? <span>Row {issue.row}</span> : null}
                          {issue.field ? <span>{issue.field}</span> : null}
                        </div>
                        <p className="mt-2 font-semibold text-slate-950">{issue.message}</p>
                        <p className="mt-1 text-sm text-slate-500">{issue.suggestion}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

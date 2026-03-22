'use client';

import { cn } from '@/lib/utils';

export default function ConsultancyDetailTabs({
  tabs,
  activeTab,
  onChange,
}: {
  tabs: string[];
  activeTab: string;
  onChange: (tab: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className={cn(
            'rounded-full px-4 py-2 text-sm font-semibold transition',
            activeTab === tab
              ? 'bg-slate-900 text-white'
              : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
          )}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

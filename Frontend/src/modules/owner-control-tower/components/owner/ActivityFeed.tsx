import { SectionCard, SectionHeader } from '@/components/app/design-system';
import type { ActivityFeedItem } from '../../types/owner-control.types';

export default function ActivityFeed({
  title = 'Owner Activity Feed',
  items,
}: {
  title?: string;
  items: ActivityFeedItem[];
}) {
  return (
    <SectionCard>
      <SectionHeader
        eyebrow="Activity Feed"
        title={title}
        description="A compact timeline of platform actions, setup changes, and operational signals."
      />
      <div className="mt-6 space-y-4">
        {items.map((item) => (
          <div key={item.id} className="flex gap-4">
            <div className="flex w-20 shrink-0 flex-col items-center">
              <div className="h-3 w-3 rounded-full bg-teal-500" />
              <div className="mt-2 h-full w-px bg-slate-200" />
            </div>
            <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50/80 p-4">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                <span>{item.type}</span>
                <span>{new Date(item.timestamp).toLocaleString()}</span>
                <span>{item.actor}</span>
              </div>
              <p className="mt-2 font-semibold text-slate-950">{item.title}</p>
              <p className="mt-1 text-sm text-slate-600">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

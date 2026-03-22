import type { LucideIcon } from 'lucide-react';
import { MetricCard } from '@/components/app/shared';

export type OwnerKpiItem = {
  label: string;
  value: string | number;
  helper: string;
  icon: LucideIcon;
  accent: string;
};

export default function OwnerKpiStrip({ items }: { items: OwnerKpiItem[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
      {items.map((item) => (
        <MetricCard
          key={item.label}
          icon={item.icon}
          label={item.label}
          value={item.value}
          helper={item.helper}
          accent={item.accent}
        />
      ))}
    </div>
  );
}

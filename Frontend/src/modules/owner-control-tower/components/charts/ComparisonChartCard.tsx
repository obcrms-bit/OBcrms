'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { SectionCard, SectionHeader } from '@/components/app/design-system';

type ComparisonChartCardProps = {
  title: string;
  description: string;
  data: Array<Record<string, number | string>>;
  dataKey: string;
  type?: 'bar' | 'line';
  color?: string;
};

export default function ComparisonChartCard({
  title,
  description,
  data,
  dataKey,
  type = 'bar',
  color = '#0f766e',
}: ComparisonChartCardProps) {
  return (
    <SectionCard>
      <SectionHeader eyebrow="Comparison" title={title} description={description} />
      <div className="mt-6 h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          {type === 'line' ? (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" tickLine={false} axisLine={false} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey={dataKey}
                stroke={color}
                strokeWidth={3}
                dot={{ fill: color, strokeWidth: 0 }}
              />
            </LineChart>
          ) : (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" tickLine={false} axisLine={false} />
              <Tooltip />
              <Bar dataKey={dataKey} fill={color} radius={[12, 12, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </SectionCard>
  );
}

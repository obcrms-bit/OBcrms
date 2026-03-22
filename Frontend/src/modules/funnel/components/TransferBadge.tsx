'use client';

import { StatusPill } from '@/components/app/shared';

type TransferBadgeProps = {
  status?: string;
};

export default function TransferBadge({ status = '' }: TransferBadgeProps) {
  if (!status) {
    return (
      <span className="text-xs font-medium text-slate-400">
        No transfer
      </span>
    );
  }

  return (
    <StatusPill tone={status}>
      {String(status || '').replace(/_/g, ' ')}
    </StatusPill>
  );
}

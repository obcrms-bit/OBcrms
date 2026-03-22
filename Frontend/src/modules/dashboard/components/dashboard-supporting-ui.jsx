import Link from 'next/link';
import { EmptyState, StatusPill, formatDate } from '@/components/app/shared';
import { getFollowUpNote } from '../utils/dashboard-utils';

export const SmallListEmpty = ({ title }) => (
  <div className="rounded-[1.25rem] border border-dashed border-slate-200 bg-slate-50/80 px-4 py-6 text-center text-sm text-slate-500">
    {title}
  </div>
);

export const FollowUpTable = ({ items, onComplete }) => {
  if (!items.length) {
    return (
      <EmptyState
        title="No follow-ups found"
        description="There are no follow-ups in this queue for the current filters."
      />
    );
  }

  return (
    <div className="ds-table-wrap">
      <table className="ds-table min-w-[960px]">
        <thead>
          <tr>
            <th>Lead</th>
            <th>Contact</th>
            <th>Schedule</th>
            <th>Counsellor</th>
            <th>Note</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item._id}>
              <td>
                <div className="space-y-1">
                  <p className="font-semibold text-slate-950">{item.leadName}</p>
                  <div className="ds-meta-row">
                    <StatusPill tone={item.urgency}>
                      {String(item.urgency || '').replace(/_/g, ' ')}
                    </StatusPill>
                    <StatusPill tone={item.status}>{item.status}</StatusPill>
                  </div>
                </div>
              </td>
              <td>{item.mobile || item.phone || item.email || 'No contact'}</td>
              <td>
                <p className="font-medium text-slate-800">{formatDate(item.scheduledAt)}</p>
                <p className="text-xs text-slate-500">
                  {new Date(item.scheduledAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </td>
              <td>{item.assignedCounsellor?.name || 'Unassigned'}</td>
              <td className="max-w-[220px]">
                <p className="line-clamp-2 text-sm text-slate-500">{getFollowUpNote(item)}</p>
              </td>
              <td>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/tenant/leads/${item.leadId}`} className="ds-button-secondary">
                    View Lead
                  </Link>
                  {item.status !== 'completed' ? (
                    <button
                      type="button"
                      onClick={() => onComplete(item)}
                      className="ds-button-primary"
                    >
                      Mark Done
                    </button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const MiniTimelineList = ({ items, emptyText, formatHelper }) => (
  <div className="space-y-3">
    {items.length ? (
      items.map((item) => (
        <div
          key={item.id || item._id}
          className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4"
        >
          <p className="font-semibold text-slate-900">{item.title || item.name || item.leadName}</p>
          <p className="mt-1 text-sm text-slate-500">{formatHelper(item)}</p>
        </div>
      ))
    ) : (
      <SmallListEmpty title={emptyText} />
    )}
  </div>
);

export const SecondaryPanelLoader = ({ label = 'Loading supporting widgets...' }) => (
  <div className="rounded-[1.25rem] border border-dashed border-slate-200 bg-slate-50/80 px-4 py-6 text-center text-sm text-slate-500">
    {label}
  </div>
);

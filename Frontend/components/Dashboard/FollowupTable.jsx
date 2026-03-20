'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarClock, Filter, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { leadAPI } from '@/services/api';
import { getApiErrorMessage } from '@/src/services/apiUtils';

const URGENCY_VARIANTS = {
  overdue: 'destructive',
  due_today: 'default',
  upcoming: 'secondary',
  pending: 'outline',
  completed: 'secondary',
};

const mapDueResponseToRows = (payload = {}) => {
  const rows = [
    ...(payload.overdue || []),
    ...(payload.dueToday || []),
    ...(payload.upcoming || []),
    ...(payload.pending || []),
  ];

  const seen = new Set();
  return rows.filter((item) => {
    const key = item?._id || `${item?.leadId}-${item?.scheduledAt}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

export default function FollowupTable() {
  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState('all');

  const fetchFollowUps = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await leadAPI.getDueFollowUps();
      setFollowUps(mapDueResponseToRows(response.data?.data || {}));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Failed to load follow-up queue.'));
      setFollowUps([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowUps();
  }, []);

  const filteredData = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return followUps.filter((item) => {
      const matchesQuery =
        !query ||
        [item.leadName, item.mobile, item.phone, item.email, item.assignedCounsellor?.name]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(query);

      const matchesUrgency =
        urgencyFilter === 'all' || item.urgency === urgencyFilter;

      return matchesQuery && matchesUrgency;
    });
  }, [followUps, searchTerm, urgencyFilter]);

  if (loading) {
    return <div className="p-4 text-sm text-slate-600">Loading follow-ups...</div>;
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
        <p className="font-semibold">Unable to load follow-ups</p>
        <p className="mt-1">{error}</p>
        <Button className="mt-4" variant="outline" onClick={fetchFollowUps}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-lg font-semibold">Scheduled Follow-ups</h3>
          <p className="text-sm text-slate-500">
            Live due, overdue, and upcoming tasks from the production backend.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search follow-ups..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-64 pl-10"
            />
          </div>
          <div className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={urgencyFilter}
              onChange={(event) => setUrgencyFilter(event.target.value)}
              className="bg-transparent outline-none"
            >
              <option value="all">All urgency</option>
              <option value="overdue">Overdue</option>
              <option value="due_today">Due today</option>
              <option value="upcoming">Upcoming</option>
            </select>
          </div>
          <Button variant="outline" onClick={fetchFollowUps}>
            Refresh
          </Button>
        </div>
      </div>

      {filteredData.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
          No follow-ups matched the current filters.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Lead</TableHead>
              <TableHead>Counsellor</TableHead>
              <TableHead>Scheduled</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Urgency</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((item) => (
              <TableRow key={item._id || `${item.leadId}-${item.scheduledAt}`}>
                <TableCell className="font-medium">
                  <div>{item.leadName}</div>
                  <div className="text-xs text-slate-500">
                    {item.mobile || item.phone || item.email || 'No contact info'}
                  </div>
                </TableCell>
                <TableCell>{item.assignedCounsellor?.name || 'Unassigned'}</TableCell>
                <TableCell>{item.scheduledAt ? new Date(item.scheduledAt).toLocaleString() : 'Not set'}</TableCell>
                <TableCell className="capitalize">
                  {String(
                    item.followUp?.completionMethod || item.followUp?.type || 'call'
                  ).replace(/_/g, ' ')}
                </TableCell>
                <TableCell>
                  <Badge variant={URGENCY_VARIANTS[item.urgency] || 'outline'}>
                    {String(item.urgency || 'pending').replace(/_/g, ' ')}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={URGENCY_VARIANTS[item.status] || 'outline'}>
                      {item.status}
                    </Badge>
                    {item.outcomeType ? (
                      <Badge variant="secondary">
                        {String(item.outcomeType).replace(/_/g, ' ')}
                      </Badge>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <div className="flex items-center gap-2 text-xs text-slate-500">
        <CalendarClock className="h-4 w-4" />
        {followUps.length} queued follow-ups loaded from the backend.
      </div>
    </div>
  );
}

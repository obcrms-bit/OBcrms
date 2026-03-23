'use client';

import { useEffect, useState } from 'react';
import { Users, Building, ClipboardList, BarChart } from 'lucide-react';
import AppShell from '@/components/app/app-shell';
import { MetricCard } from '@/components/app/shared';
import { dashboardAPI, organizationAPI } from '@/services/api';
import { DataTableSurface } from '@/components/app/design-system';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [statsRes, summaryRes] = await Promise.all([
          dashboardAPI.getDashboardStats(),
          organizationAPI.getSummary(),
        ]);
        setStats(statsRes.data.data);
        setSummary(summaryRes.data.data);
      } catch (err) {
        setError(err.message || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const cards = [
    { label: 'Total Leads', value: stats?.totalLeads || 0, icon: Users, accent: 'bg-sky-600' },
    { label: 'Total Students', value: stats?.totalStudents || 0, icon: Users, accent: 'bg-violet-600' },
    { label: 'Total Applications', value: stats?.totalApplications || 0, icon: ClipboardList, accent: 'bg-fuchsia-600' },
    { label: 'Revenue', value: `$${stats?.revenue || 0}`, icon: BarChart, accent: 'bg-emerald-600' },
  ];

  if (loading) {
    return (
      <AppShell title="Admin Dashboard">
        <div>Loading...</div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell title="Admin Dashboard">
        <div>Error: {error}</div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Admin Dashboard" description="Tenant-wide overview and management.">
      <div className="ds-kpi-grid xl:grid-cols-2 2xl:grid-cols-4">
        {cards.map((card) => (
          <MetricCard key={card.label} {...card} />
        ))}
      </div>
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DataTableSurface>
          <h3 className="text-lg font-semibold">Users</h3>
          <div className="ds-table-wrap mt-4">
            <table className="ds-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Branch</th>
                </tr>
              </thead>
              <tbody>
                {summary?.users.map((user) => (
                  <tr key={user._id}>
                    <td>{user.name}</td>
                    <td>{user.role}</td>
                    <td>{user.branch?.name || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DataTableSurface>
        <DataTableSurface>
          <h3 className="text-lg font-semibold">Branches</h3>
          <div className="ds-table-wrap mt-4">
            <table className="ds-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Location</th>
                  <th>Users</th>
                </tr>
              </thead>
              <tbody>
                {summary?.branches.map((branch) => (
                  <tr key={branch._id}>
                    <td>{branch.name}</td>
                    <td>{branch.location}</td>
                    <td>{branch.userCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DataTableSurface>
      </div>
    </AppShell>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { Building, Users, Briefcase, BarChart } from 'lucide-react';
import AppShell from '@/components/app/app-shell';
import { MetricCard } from '@/components/app/shared';
import { superAdminAPI } from '@/services/api';
import { DataTableSurface } from '@/components/app/design-system';

export default function SuperAdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [overviewRes, tenantsRes] = await Promise.all([
          superAdminAPI.getOverview(),
          superAdminAPI.listTenants(),
        ]);
        setOverview(overviewRes.data.data);
        setTenants(tenantsRes.data.data.tenants);
      } catch (err) {
        setError(err.message || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const cards = [
    { label: 'Total Tenants', value: overview?.totalTenants || 0, icon: Building, accent: 'bg-sky-600' },
    { label: 'Total Users', value: overview?.totalUsers || 0, icon: Users, accent: 'bg-violet-600' },
    { label: 'Active Subscriptions', value: overview?.activeSubscriptions || 0, icon: Briefcase, accent: 'bg-fuchsia-600' },
    { label: 'Platform Revenue', value: `$${overview?.platformRevenue || 0}`, icon: BarChart, accent: 'bg-emerald-600' },
  ];

  if (loading) {
    return (
      <AppShell title="Super Admin Dashboard">
        <div>Loading...</div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell title="Super Admin Dashboard">
        <div>Error: {error}</div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Super Admin Dashboard" description="Platform-wide overview and tenant management.">
      <div className="ds-kpi-grid xl:grid-cols-2 2xl:grid-cols-4">
        {cards.map((card) => (
          <MetricCard key={card.label} {...card} />
        ))}
      </div>
      <div className="mt-6">
        <DataTableSurface>
          <div className="ds-table-wrap">
            <table className="ds-table">
              <thead>
                <tr>
                  <th>Tenant</th>
                  <th>Status</th>
                  <th>Users</th>
                  <th>Plan</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((tenant) => (
                  <tr key={tenant._id}>
                    <td>{tenant.name}</td>
                    <td>{tenant.status}</td>
                    <td>{tenant.userCount}</td>
                    <td>{tenant.subscription?.plan?.name || 'N/A'}</td>
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

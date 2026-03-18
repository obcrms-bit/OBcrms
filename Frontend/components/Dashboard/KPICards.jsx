'use client';

import { useState, useEffect } from 'react';
import { Users, FileText, Phone, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { dashboardAPI } from '@/services/api';

const defaultKpiData = [
  { title: 'Employees', value: '45', icon: Users, change: '+2' },
  { title: 'Leads', value: '1,234', icon: FileText, change: '+12%' },
  { title: 'Students', value: '856', icon: Users, change: '+8%' },
  { title: 'Applications', value: '342', icon: FileText, change: '+15%' },
  { title: 'Call Logs', value: '2,156', icon: Phone, change: '+23%' },
  { title: 'Classes', value: '28', icon: Calendar, change: '+1' },
];

export default function KPICards() {
  const [kpiData, setKpiData] = useState(defaultKpiData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKPIData();
  }, []);

  const fetchKPIData = async () => {
    try {
      const response = await dashboardAPI.getStats();
      const data = response.data.data;

      // Map API data to KPI format
      const apiKpiData = [
        {
          title: 'Students',
          value: data.totalStudents?.toString() || '0',
          icon: Users,
          change: '+8%',
        },
        {
          title: 'Leads',
          value: data.totalLeads?.toString() || '0',
          icon: FileText,
          change: '+12%',
        },
        {
          title: 'Applications',
          value: data.totalApplications?.toString() || '0',
          icon: FileText,
          change: '+15%',
        },
        {
          title: 'Revenue',
          value: `$${(data.revenue || 0).toLocaleString()}`,
          icon: Calendar,
          change: '+10%',
        },
        { title: 'Call Logs', value: '2,156', icon: Phone, change: '+23%' },
        { title: 'Classes', value: '28', icon: Calendar, change: '+1' },
      ];
      setKpiData(apiKpiData);
    } catch (error) {
      console.error('Error fetching KPI data:', error);
      // Keep default data if API fails
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array(6)
          .fill(0)
          .map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {kpiData.map((kpi) => (
        <Card key={kpi.title}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {kpi.title}
                </p>
                <p className="text-2xl font-bold">{kpi.value}</p>
                <p className="text-xs text-green-600">{kpi.change}</p>
              </div>
              <kpi.icon className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

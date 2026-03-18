'use client';

import { useState } from 'react';
import Header from '@/components/Dashboard/Header';
import Sidebar from '@/components/Dashboard/Sidebar';
import FollowupTable from '@/components/Dashboard/FollowupTable';
import CalendarView from '@/components/Dashboard/CalendarView';
import Panels from '@/components/Dashboard/Panels';
import Charts from '@/components/Dashboard/Charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DashboardPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div
      className={`min-h-screen bg-gray-50 ${darkMode ? 'dark bg-gray-900' : ''}`}
    >
      <Sidebar
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />

      <div
        className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}
      >
        <Header darkMode={darkMode} setDarkMode={setDarkMode} />

        <main className="p-6 space-y-6">
          {/* Scheduled Followup Table */}
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Followup</CardTitle>
            </CardHeader>
            <CardContent>
              <FollowupTable />
            </CardContent>
          </Card>

          {/* Charts Section */}
          <Charts />

          {/* Calendar and Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <CalendarView />
            </div>
            <div className="space-y-6">
              <Panels />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

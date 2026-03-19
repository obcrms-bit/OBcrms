'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Header from '@/components/Dashboard/Header';
import Sidebar from '@/components/Dashboard/Sidebar';
import FollowupTable from '@/components/Dashboard/FollowupTable';
import CalendarView from '@/components/Dashboard/CalendarView';
import Panels from '@/components/Dashboard/Panels';
import Charts from '@/components/Dashboard/Charts';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-4 text-slate-700 shadow-sm">
          Checking your session...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
        <div className="max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-200/60">
          <h1 className="text-2xl font-semibold text-slate-900">
            Sign in required
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            The dashboard is protected by JWT authentication. Redirecting you
            to the login page now.
          </p>
          <Link
            className="mt-6 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white"
            href="/login"
          >
            Go to login
          </Link>
        </div>
      </div>
    );
  }

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

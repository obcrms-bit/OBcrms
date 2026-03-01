import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, BookOpen } from 'lucide-react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import StatsCard from '../components/Dashboard/StatsCard';

const CounselorDashboard = () => {
  const [stats, setStats] = useState({
    assignedStudents: 12,
    processing: 5,
    approved: 4,
  });

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your assigned students and track progress</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard
            title="Assigned Students"
            value={stats.assignedStudents}
            icon={Users}
            color="primary"
            description="Under your management"
          />
          <StatsCard
            title="In Processing"
            value={stats.processing}
            icon={TrendingUp}
            color="warning"
            description="Need attention"
          />
          <StatsCard
            title="Visa Approved"
            value={stats.approved}
            icon={BookOpen}
            color="success"
            description="Successfully processed"
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Students List */}
          <div className="lg:col-span-2">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">My Students</h2>
                <a href="#" className="text-primary-500 hover:text-primary-600 text-sm font-medium">
                  View All →
                </a>
              </div>
              <p className="text-gray-600 text-center py-8">
                Student management interface coming soon...
              </p>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Status Breakdown */}
            <div className="card p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Status Breakdown</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">New</span>
                    <span className="text-sm font-bold text-gray-900">4</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-primary-500 h-2 rounded-full" style={{ width: '33%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Processing</span>
                    <span className="text-sm font-bold text-gray-900">5</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-warning-500 h-2 rounded-full" style={{ width: '42%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Approved</span>
                    <span className="text-sm font-bold text-gray-900">3</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-success-500 h-2 rounded-full" style={{ width: '25%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Upcoming Tasks */}
            <div className="card p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Next Steps</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <input type="checkbox" className="mt-1 w-4 h-4 text-primary-500" />
                  <p className="text-sm text-gray-700">Review 3 applications</p>
                </div>
                <div className="flex items-start space-x-3">
                  <input type="checkbox" className="mt-1 w-4 h-4 text-primary-500" />
                  <p className="text-sm text-gray-700">Follow up on documents</p>
                </div>
                <div className="flex items-start space-x-3">
                  <input type="checkbox" className="mt-1 w-4 h-4 text-primary-500" />
                  <p className="text-sm text-gray-700">Schedule meetings</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CounselorDashboard;

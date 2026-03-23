'use client';

import React from 'react';
import { Building2, Users, FileText, AlertTriangle, CheckCircle, Clock, Activity, UploadCloud, Database } from 'lucide-react';

const StatsCards = () => {
    const stats = [
        { label: 'Total Tenants', count: 48, icon: Building2, color: 'bg-indigo-100 text-indigo-600' },
        { label: 'Active Tenants', count: 42, icon: CheckCircle, color: 'bg-emerald-100 text-emerald-600' },
        { label: 'Suspended', count: 3, icon: AlertTriangle, color: 'bg-rose-100 text-rose-600' },
        { label: 'Onboarding', count: 3, icon: Clock, color: 'bg-amber-100 text-amber-600' },
        { label: 'Global Branches', count: 156, icon: Database, color: 'bg-blue-100 text-blue-600' },
        { label: 'Total Users', count: 1240, icon: Users, color: 'bg-purple-100 text-purple-600' },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            {stats.map((s, i) => (
                <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
                    <div className={`p-3 rounded-lg ${s.color}`}>
                        <s.icon className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{s.label}</p>
                        <h3 className="text-2xl font-bold text-gray-800">{s.count}</h3>
                    </div>
                </div>
            ))}
        </div>
    );
};

const RiskPanel = () => {
    const alerts = [
        { id: 1, type: 'critical', msg: 'Tenant "Global Edu" setup stuck at 40% for 3 days.', time: '2 hours ago' },
        { id: 2, type: 'warning', msg: 'Failed import job #4029 (Duplicate Emails detected).', time: '5 hours ago' },
        { id: 3, type: 'info', msg: 'Tenant "Future Path" activated 5 new branches.', time: '1 day ago' },
        { id: 4, type: 'critical', msg: 'No active Admin assigned to tenant ID #1042.', time: '1 day ago' },
    ];

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex-1">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-rose-500" />
                Alerts & Risk Panel
            </h3>
            <div className="space-y-4">
                {alerts.map(alert => (
                    <div key={alert.id} className={`p-4 rounded-lg border flex justify-between items-start ${alert.type === 'critical' ? 'bg-rose-50 border-rose-100 text-rose-800' :
                            alert.type === 'warning' ? 'bg-amber-50 border-amber-100 text-amber-800' :
                                'bg-blue-50 border-blue-100 text-blue-800'
                        }`}>
                        <div>
                            <p className="text-sm font-medium">{alert.msg}</p>
                            <p className="text-xs mt-1 opacity-70">{alert.time}</p>
                        </div>
                        <button className="text-xs font-semibold underline hover:opacity-80">Resolve</button>
                    </div>
                ))}
            </div>
        </div>
    );
};

const PlatformActivity = () => {
    const activities = [
        { action: 'Batch Import Completed', tenant: 'Alpha Consultants', status: 'Success', date: 'Today, 10:45 AM' },
        { action: 'Tenant Suspended', tenant: 'Omega Visa', status: 'Manual Action', date: 'Yesterday, 04:20 PM' },
        { action: 'New Admin Assigned', tenant: 'Global Edu', status: 'System', date: 'Yesterday, 11:10 AM' },
        { action: 'Data Export Run', tenant: 'All Tenants', status: 'Success', date: 'Oct 24, 02:00 AM' },
    ];

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex-1">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-indigo-500" />
                Recent Platform Activity
            </h3>
            <table className="w-full text-left">
                <thead>
                    <tr className="text-xs text-gray-500 uppercase border-b border-gray-100">
                        <th className="pb-3 font-medium">Action</th>
                        <th className="pb-3 font-medium">Target</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium">Date</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {activities.map((act, i) => (
                        <tr key={i}>
                            <td className="py-3 text-sm text-gray-800 font-medium">{act.action}</td>
                            <td className="py-3 text-sm text-gray-500">{act.tenant}</td>
                            <td className="py-3">
                                <span className={`px-2 py-1 text-xs rounded-md ${act.status === 'Success' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}`}>
                                    {act.status}
                                </span>
                            </td>
                            <td className="py-3 text-sm text-gray-500">{act.date}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default function OwnerConsole() {
    return (
        <div className="animate-in fade-in duration-500 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Master Control Tower</h1>
                    <p className="text-sm text-gray-500 mt-1">Global oversight across all platform tenants and infrastructure.</p>
                </div>
                <div className="flex space-x-3">
                    <button className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 shadow-sm text-gray-700 transition-colors">
                        <FileText className="w-4 h-4 mr-2" />
                        Audit Logs
                    </button>
                    <button className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm transition-colors">
                        <UploadCloud className="w-4 h-4 mr-2" />
                        Import New Tenant
                    </button>
                </div>
            </div>

            <StatsCards />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <RiskPanel />
                <PlatformActivity />
            </div>

            <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl shadow-lg p-6 text-white flex justify-between items-center">
                <div>
                    <h3 className="font-semibold text-lg">System Health Status: Optimal</h3>
                    <p className="text-slate-300 text-sm mt-1">All microservices and database shards are operating normally across 4 regions.</p>
                </div>
                <button className="bg-white/10 hover:bg-white/20 border border-white/20 px-5 py-2 rounded-lg text-sm font-medium transition-colors">
                    View Infrastructure
                </button>
            </div>
        </div>
    );
}
'use client';

import React, { useState } from 'react';
import { Users, UserPlus, GraduationCap, Phone, BookOpen, FileText, Search, RotateCcw, Star, CalendarClock } from 'lucide-react';

// --- Subcomponents mapping exact UI ---

const StatsCards = () => {
    const stats = [
        { label: 'Employee', count: 42, icon: Users, color: 'bg-blue-100 text-blue-600' },
        { label: 'Lead', count: 1250, icon: UserPlus, color: 'bg-indigo-100 text-indigo-600' },
        { label: 'Student', count: 850, icon: GraduationCap, color: 'bg-emerald-100 text-emerald-600' },
        { label: 'Call Log', count: 342, icon: Phone, color: 'bg-amber-100 text-amber-600' },
        { label: 'Class', count: 28, icon: BookOpen, color: 'bg-purple-100 text-purple-600' },
        { label: 'Application', count: 156, icon: FileText, color: 'bg-rose-100 text-rose-600' },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            {stats.map((s, i) => (
                <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4 hover:shadow-md transition-shadow">
                    <div className={`p-3 rounded-lg ${s.color}`}>
                        <s.icon className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">{s.label}</p>
                        <h3 className="text-2xl font-bold text-gray-800">{s.count}</h3>
                    </div>
                </div>
            ))}
        </div>
    );
};

const CenterPanel = () => {
    const tabs = ['Scheduled Followup', 'Expected Offer', 'Issued Offer', 'Application', 'Visa Lodgement'];
    const [activeTab, setActiveTab] = useState(tabs[0]);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 flex-1">
            <div className="border-b border-gray-200">
                <div className="flex overflow-x-auto">
                    {tabs.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            <div className="p-4 flex items-center justify-between bg-gray-50 border-b border-gray-100">
                <div className="flex space-x-3 w-2/3">
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                        <input type="text" placeholder="Search name or phone..." className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <input type="date" className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-600 focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <button className="flex items-center px-4 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                    <RotateCcw className="w-4 h-4 mr-2" /> Reset
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                            <th className="px-6 py-3 font-medium">Name</th>
                            <th className="px-6 py-3 font-medium">Phone</th>
                            <th className="px-6 py-3 font-medium">FollowUp Date</th>
                            <th className="px-6 py-3 font-medium">Time</th>
                            <th className="px-6 py-3 font-medium">Assigned To</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {/* Mock Data */}
                        {[1, 2, 3, 4, 5].map((_, i) => (
                            <tr key={i} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 text-sm font-medium text-gray-900">Sarah Jenkins</td>
                                <td className="px-6 py-4 text-sm text-gray-500">+1 234 567 890</td>
                                <td className="px-6 py-4 text-sm text-gray-500">Oct 24, 2023</td>
                                <td className="px-6 py-4 text-sm text-gray-500">14:30 PM</td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">Alex Counselor</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const RightSidebar = () => {
    return (
        <div className="w-80 flex-shrink-0 space-y-6">
            {/* Highlights */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center"><Star className="w-4 h-4 mr-2 text-yellow-500" /> Key Highlights</h3>
                <div className="space-y-3">
                    <div className="p-3 bg-blue-50 text-blue-800 rounded-lg text-sm border border-blue-100">3 New Offer Letters Issued Today</div>
                    <div className="p-3 bg-green-50 text-green-800 rounded-lg text-sm border border-green-100">12 Visas Approved this week</div>
                </div>
            </div>

            {/* Reminders & Tasks */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h3 className="font-semibold text-gray-800 mb-4">My Tasks & Reminders</h3>
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex items-start space-x-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                            <input type="checkbox" className="mt-1 rounded text-blue-600 focus:ring-blue-500" />
                            <div>
                                <p className="text-sm font-medium text-gray-800">Call University of Sydney</p>
                                <p className="text-xs text-gray-500">Regarding Student ID: #99482</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* HR / Team Updates */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h3 className="font-semibold text-gray-800 mb-4">Team Updates</h3>
                <div className="space-y-3">
                    <div className="flex items-center text-sm"><span className="w-2 h-2 rounded-full bg-pink-500 mr-2"></span> 🎂 Mike's Birthday Tomorrow</div>
                    <div className="flex items-center text-sm"><span className="w-2 h-2 rounded-full bg-orange-500 mr-2"></span> 🏖️ Sarah is on Leave Today</div>
                    <div className="flex items-center text-sm"><span className="w-2 h-2 rounded-full bg-purple-500 mr-2"></span> 🎉 2nd Work Anniversary for David</div>
                </div>
            </div>
        </div>
    );
};

const CalendarPlaceholder = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 h-96 flex flex-col items-center justify-center text-gray-400">
        <CalendarClock className="w-12 h-12 mb-3 text-gray-300" />
        <p>Monthly Calendar View Component</p>
        <p className="text-sm">Integrated with FullCalendar</p>
    </div>
);

export default function Dashboard() {
    return (
        <div className="animate-in fade-in duration-500">
            <StatsCards />

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Main Left Column */}
                <div className="flex-1 flex flex-col">
                    <CenterPanel />
                    <CalendarPlaceholder />
                </div>

                {/* Right Sidebar */}
                <RightSidebar />
            </div>
        </div>
    );
}
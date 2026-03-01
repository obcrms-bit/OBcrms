import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    Users, Globe, GraduationCap, Phone, BookOpen, FileText,
    Filter, RotateCcw, ChevronLeft, ChevronRight, User as UserIcon, Clock
} from 'lucide-react';

const KPICard = ({ icon: Icon, title, value, colorClass, bgColorClass }) => (
    <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm flex items-center gap-4">
        <div className={`p-3 rounded-full ${bgColorClass} ${colorClass}`}>
            <Icon size={24} />
        </div>
        <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">{title}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
    </div>
);

const DashboardPage = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('Scheduled Followup');

    const tabs = [
        'Scheduled Followup',
        'Expected Offer',
        'Issued Offer',
        'Application',
        'Visa Lodgement',
    ];

    const followupData = [
        { id: 1, name: 'Ronika Rai', phone: '9841653526', date: '01-03-2026', time: '15:04:07', assignedTo: 'Prakriti Tiwari', note: 'gau pnuuko' },
        { id: 2, name: 'Rom Kishun Sohlwar', phone: '9768848540', date: '01-03-2026', time: '15:04:07', assignedTo: 'Manoj Shrestha', note: 'Call not answered' },
        { id: 3, name: 'Resham Dhakal', phone: '9768919393', date: '01-03-2026', time: '15:04:07', assignedTo: 'Manoj Shrestha', note: 'Switched off' },
        { id: 4, name: 'umesh phokrel', phone: '9841990326', date: '01-03-2026', time: '15:04:07', assignedTo: 'Manoj Shrestha', note: 'PTE in final bm...' },
        { id: 5, name: 'Robin', phone: '-', date: '01-03-2026', time: '15:04:07', assignedTo: 'Manoj Shrestha', note: '' },
    ];

    return (
        <div className="flex flex-col xl:flex-row gap-4 h-full">
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2">
                {/* Header Greeting */}
                <div>
                    <h1 className="text-2xl font-semibold text-gray-800">
                        Good Morning, {user?.name || 'Sagar K C'}!
                    </h1>
                    <p className="text-gray-500 text-sm">Let's make today a great one together!</p>
                </div>

                {/* Top Grid Area (Profile + KPIs) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    {/* Profile Card */}
                    <div className="lg:col-span-3 bg-white rounded-lg border border-gray-100 shadow-sm flex flex-col items-center justify-center p-6">
                        <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center text-gray-400 mb-3">
                            <UserIcon size={40} />
                        </div>
                        <h3 className="font-semibold text-gray-800">{user?.name || 'Sagar K C'}</h3>
                    </div>

                    {/* KPI Grid */}
                    <div className="lg:col-span-9 grid grid-cols-2 md:grid-cols-3 gap-4">
                        <KPICard icon={Users} title="EMPLOYEE" value="32" colorClass="text-green-500" bgColorClass="bg-green-100" />
                        <KPICard icon={Globe} title="LEAD" value="13,432" colorClass="text-purple-500" bgColorClass="bg-purple-100" />
                        <KPICard icon={GraduationCap} title="STUDENT" value="842" colorClass="text-orange-500" bgColorClass="bg-orange-100" />
                        <KPICard icon={Phone} title="CALLLOG" value="572" colorClass="text-blue-500" bgColorClass="bg-blue-100" />
                        <KPICard icon={BookOpen} title="CLASS" value="1" colorClass="text-yellow-500" bgColorClass="bg-yellow-100" />
                        <KPICard icon={FileText} title="APPLICATION" value="851" colorClass="text-indigo-500" bgColorClass="bg-indigo-100" />
                    </div>
                </div>

                {/* Stay Updated Section */}
                <div className="bg-white rounded-lg border border-gray-100 shadow-sm flex-1 flex flex-col min-h-[400px]">
                    <div className="p-3 border-b border-gray-100 uppercase text-xs font-bold text-blue-500 tracking-wider">
                        STAY UPDATED
                    </div>
                    <div className="flex flex-1 overflow-hidden">
                        {/* Tabs */}
                        <div className="w-48 border-r border-gray-100 py-2 flex flex-col">
                            {tabs.map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`text-left px-4 py-3 text-sm font-medium transition-colors ${activeTab === tab
                                            ? 'bg-blue-500 text-white rounded-r-lg mr-2'
                                            : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 p-4 flex flex-col">
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex bg-gray-50 rounded-md border border-gray-200 overflow-hidden w-64">
                                    <div className="px-3 flex items-center justify-center text-gray-400">
                                        <Search size={16} />
                                    </div>
                                    <input type="text" placeholder="Search" className="bg-transparent border-none outline-none text-sm py-2 w-full" />
                                </div>

                                <div className="flex gap-2">
                                    <div className="flex border border-gray-200 rounded-md bg-white">
                                        <input type="text" placeholder="mm/dd/yyyy" className="py-2 px-3 text-sm w-32 outline-none" />
                                        <button className="px-2 text-gray-400 border-l border-gray-200"><RotateCcw size={14} /></button>
                                    </div>
                                    <button className="bg-blue-600 text-white px-3 py-2 rounded-md flex items-center gap-2 text-sm">
                                        <Filter size={14} /> Filter
                                    </button>
                                    <button className="bg-gray-500 text-white px-3 py-2 rounded-md flex items-center gap-2 text-sm">
                                        <RotateCcw size={14} /> Reset
                                    </button>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="overflow-x-auto border border-gray-200 rounded-md">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-[#5928E5] text-white">
                                        <tr>
                                            <th className="px-4 py-3 font-semibold w-10">#</th>
                                            <th className="px-4 py-3 font-semibold">Followable</th>
                                            <th className="px-4 py-3 font-semibold">FollowUp Date</th>
                                            <th className="px-4 py-3 font-semibold">FollowUp Time</th>
                                            <th className="px-4 py-3 font-semibold">Assigned To</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {followupData.map((row, index) => (
                                            <tr key={row.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                                                <td className="px-4 py-3 border-b border-gray-100">{row.id}</td>
                                                <td className="px-4 py-3 border-b border-gray-100">
                                                    <div className="flex items-center gap-2 text-blue-500">
                                                        <UserIcon size={14} />
                                                        <span>{row.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-gray-500 mt-1 text-xs">
                                                        <Phone size={12} />
                                                        <span>{row.phone}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 border-b border-gray-100 text-red-500 flex items-center gap-2">
                                                    <Calendar size={14} />
                                                    {row.date}
                                                </td>
                                                <td className="px-4 py-3 border-b border-gray-100 text-orange-400 flex items-center gap-2">
                                                    <Clock size={14} />
                                                    {row.time}
                                                </td>
                                                <td className="px-4 py-3 border-b border-gray-100">
                                                    <div className="text-gray-800">{row.assignedTo}</div>
                                                    <div className="text-gray-400 text-xs italic mt-1">{row.note}</div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Calendar Section */}
                <div className="bg-white rounded-lg border border-gray-100 shadow-sm flex flex-col min-h-[300px] mb-4">
                    <div className="p-4 flex justify-between items-center border-b border-gray-100">
                        <div className="flex gap-2">
                            <button className="bg-blue-100 text-blue-600 p-1.5 rounded"><ChevronLeft size={16} /></button>
                            <button className="bg-blue-100 text-blue-600 p-1.5 rounded"><ChevronRight size={16} /></button>
                            <button className="bg-blue-500 text-white px-4 py-1.5 rounded text-sm">Today</button>
                        </div>
                        <div className="font-bold text-gray-700">MARCH 2026</div>
                        <div className="flex bg-gray-100 rounded overflow-hidden text-sm">
                            <button className="bg-blue-500 text-white px-3 py-1.5">Month</button>
                            <button className="px-3 py-1.5 text-gray-600 hover:bg-gray-200">Week</button>
                            <button className="px-3 py-1.5 text-gray-600 hover:bg-gray-200">Day</button>
                            <button className="px-3 py-1.5 text-gray-600 hover:bg-gray-200">List</button>
                        </div>
                    </div>
                    <div className="flex-1 p-4 flex items-center justify-center text-gray-400">
                        [Calendar Grid Placeholder]
                    </div>
                </div>
            </div>

            {/* Right Sidebar */}
            <div className="w-full xl:w-80 flex flex-col gap-4 flex-shrink-0">
                <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-4 h-64">
                    <h3 className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">KEY HIGHLIGHTS</h3>
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-400 text-white flex items-center justify-center shrink-0">H</div>
                        <div>
                            <p className="text-sm font-medium text-blue-500">Sweden : Late Application Courses</p>
                            <p className="text-xs text-gray-400 mt-1">1 week ago</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-4 h-32 flex flex-col">
                    <h3 className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-2 border-b border-gray-100 pb-2">REMINDER</h3>
                    <div className="flex-1 flex items-center text-sm text-gray-500">
                        No reminders found
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-4 flex-1">
                    <h3 className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">TASKS</h3>
                    <div className="flex gap-3 items-start border-l-2 border-blue-500 pl-3">
                        <div className="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs shrink-0 mt-1">T</div>
                        <div className="flex-1">
                            <p className="text-xs text-blue-500 font-medium">2026-06-27 - 2026-06-27</p>
                            <p className="text-sm text-gray-700 mt-0.5">document collect</p>
                        </div>
                        <div className="w-6 h-6 bg-gray-200 rounded-full shrink-0"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;

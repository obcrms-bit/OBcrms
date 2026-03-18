import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useBranding } from '../context/BrandingContext';
import {
  Users,
  Globe,
  GraduationCap,
  Phone,
  BookOpen,
  FileText,
  Filter,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  User as UserIcon,
  Clock,
  Search,
  Calendar,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';

const KPICard = ({ icon: Icon, title, value, color, bgColor }) => (
  <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow group">
    <div
      className="p-3 rounded-xl transition-transform group-hover:scale-110"
      style={{ backgroundColor: bgColor, color: color }}
    >
      <Icon size={24} />
    </div>
    <div>
      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">
        {title}
      </p>
      <p className="text-2xl font-black text-gray-800 leading-none">{value}</p>
    </div>
  </div>
);

import { dashboardAPI } from '../services/api';
import { DollarSign } from 'lucide-react';

const DashboardPage = () => {
  const { user } = useAuth();
  const { branding } = useBranding();
  const [activeTab, setActiveTab] = useState('Scheduled Followup');
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalLeads: 0,
    totalApplications: 0,
    revenue: 0,
    applicationsByStatus: {},
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await dashboardAPI.getDashboardStats();
        setStats(response.data.data);
      } catch (error) {
        console.error('Failed to fetch dashboard stats', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const tabs = [
    'Scheduled Followup',
    'Expected Offer',
    'Issued Offer',
    'Application',
    'Visa Lodgement',
  ];

  const followupData = [
    {
      id: 1,
      name: 'Ronika Rai',
      phone: '9841653526',
      date: '01-03-2026',
      time: '15:04:07',
      assignedTo: 'Prakriti Tiwari',
      note: 'gau pnuuko',
    },
    {
      id: 2,
      name: 'Rom Kishun Sohlwar',
      phone: '9768848540',
      date: '01-03-2026',
      time: '15:04:07',
      assignedTo: 'Manoj Shrestha',
      note: 'Call not answered',
    },
    {
      id: 3,
      name: 'Resham Dhakal',
      phone: '9768919393',
      date: '01-03-2026',
      time: '15:04:07',
      assignedTo: 'Manoj Shrestha',
      note: 'Switched off',
    },
    {
      id: 4,
      name: 'umesh phokrel',
      phone: '9841990326',
      date: '01-03-2026',
      time: '15:04:07',
      assignedTo: 'Manoj Shrestha',
      note: 'PTE in final bm...',
    },
    {
      id: 5,
      name: 'Robin',
      phone: '-',
      date: '01-03-2026',
      time: '15:04:07',
      assignedTo: 'Manoj Shrestha',
      note: '',
    },
  ];

  return (
    <div className="flex flex-col xl:flex-row gap-6 h-full p-2">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
        {/* Header Greeting */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-gray-800 tracking-tight">
              Hi, {user?.name || 'Admin'}!
            </h1>
            <p className="text-gray-500 font-medium">
              Welcome back to your {branding.name} dashboard.
            </p>
          </div>
        </div>

        {/* Top Grid Area (Profile + KPIs) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Profile Summary Card */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center p-8 text-center relative overflow-hidden group">
            <div
              className="absolute top-0 left-0 w-full h-1"
              style={{ backgroundColor: branding.primaryColor }}
            />
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-4 border-4 border-white shadow-lg overflow-hidden transition-transform group-hover:scale-105">
              <UserIcon size={48} />
            </div>
            <h3 className="font-bold text-gray-800 text-lg">{user?.name}</h3>
            <p
              className="text-xs font-bold uppercase tracking-wider mb-4"
              style={{ color: branding.primaryColor }}
            >
              {user?.role}
            </p>
            <button className="w-full py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-xs font-bold text-gray-600 transition-colors">
              Edit Profile
            </button>
          </div>

          {/* KPI Grid */}
          <div className="lg:col-span-9 grid grid-cols-2 lg:grid-cols-3 gap-4">
            <KPICard
              icon={Globe}
              title="ACTIVE LEADS"
              value={stats.totalLeads.toLocaleString()}
              color="#8b5cf6"
              bgColor="#f5f3ff"
            />
            <KPICard
              icon={GraduationCap}
              title="TOTAL STUDENTS"
              value={stats.totalStudents.toLocaleString()}
              color="#f59e0b"
              bgColor="#fffbeb"
            />
            <KPICard
              icon={FileText}
              title="APPLICATIONS"
              value={stats.totalApplications.toLocaleString()}
              color="#3b82f6"
              bgColor="#eff6ff"
            />
            <KPICard
              icon={DollarSign}
              title="REVENUE (PAID)"
              value={stats.revenue.toLocaleString()}
              color="#10b981"
              bgColor="#ecfdf5"
            />
            <KPICard
              icon={Phone}
              title="FOLLOWUPS"
              value="0"
              color={branding.primaryColor}
              bgColor={`${branding.primaryColor}10`}
            />
            <KPICard
              icon={BookOpen}
              title="ACTIVE CLASSES"
              value="0"
              color="#f43f5e"
              bgColor="#fff1f2"
            />
          </div>
        </div>

        {/* Stay Updated Section */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex-1 flex flex-col min-h-[500px] overflow-hidden">
          <div className="p-4 border-b border-gray-50 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} style={{ color: branding.primaryColor }} />
              <h2
                className="uppercase text-xs font-black tracking-[0.2em]"
                style={{ color: branding.primaryColor }}
              >
                Live Activities & Followups
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex bg-gray-100/50 p-1 rounded-lg">
                {tabs.slice(0, 3).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${activeTab === tab ? 'bg-white shadow-sm text-gray-800' : 'text-gray-400'}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Vertical Tabs Sidebar */}
            <div className="w-56 border-r border-gray-50 py-4 flex flex-col bg-gray-50/30">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`text-left px-6 py-3.5 text-xs font-bold transition-all border-r-2 ${
                    activeTab === tab
                      ? 'text-gray-900 border-current font-black'
                      : 'text-gray-400 border-transparent hover:text-gray-600 hover:bg-gray-50'
                  }`}
                  style={
                    activeTab === tab
                      ? {
                          color: branding.primaryColor,
                          borderColor: branding.primaryColor,
                          backgroundColor: `${branding.primaryColor}05`,
                        }
                      : {}
                  }
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Updated Content Area */}
            <div className="flex-1 p-6 flex flex-col bg-white">
              <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <div
                  className="flex bg-gray-50 rounded-xl border border-gray-200 overflow-hidden w-full sm:w-80 focus-within:ring-2 focus-within:ring-offset-1 transition-all"
                  style={{ '--tw-ring-color': branding.primaryColor }}
                >
                  <div className="px-3 flex items-center justify-center text-gray-400">
                    <Search size={16} />
                  </div>
                  <input
                    type="text"
                    placeholder="Search records..."
                    className="bg-transparent border-none outline-none text-sm py-2.5 w-full font-medium"
                  />
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button className="flex-1 sm:flex-none px-4 py-2.5 bg-gray-50 text-gray-600 rounded-xl border border-gray-200 text-xs font-bold flex items-center justify-center gap-2 hover:bg-gray-100">
                    <Calendar size={14} /> mm/dd/yyyy
                  </button>
                  <button
                    className="flex-1 sm:flex-none px-6 py-2.5 text-white rounded-xl shadow-lg transition-transform active:scale-95 text-xs font-bold flex items-center justify-center gap-2"
                    style={{
                      backgroundColor: branding.primaryColor,
                      boxShadow: `0 4px 14px 0 ${branding.primaryColor}40`,
                    }}
                  >
                    <Filter size={14} /> Apply Filter
                  </button>
                </div>
              </div>

              {/* Table with corporate branding */}
              <div className="overflow-x-auto border border-gray-100 rounded-xl shadow-sm">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr
                      className="text-white uppercase text-[10px] font-black tracking-widest"
                      style={{ backgroundColor: branding.primaryColor }}
                    >
                      <th className="px-6 py-4 border-r border-white/10 w-12 text-center">
                        #
                      </th>
                      <th className="px-6 py-4 border-r border-white/10">
                        Followable Student
                      </th>
                      <th className="px-6 py-4 border-r border-white/10 text-center">
                        Date
                      </th>
                      <th className="px-6 py-4 border-r border-white/10 text-center">
                        Time
                      </th>
                      <th className="px-6 py-4">Assigned Manager</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {followupData.map((row, index) => (
                      <tr
                        key={row.id}
                        className="hover:bg-gray-50/80 transition-colors group"
                      >
                        <td className="px-6 py-4 text-gray-400 font-bold text-center border-r border-gray-50">
                          {row.id}
                        </td>
                        <td className="px-6 py-4 border-r border-gray-50">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-[10px] group-hover:bg-white transition-colors border border-transparent group-hover:border-gray-100">
                              {row.name.charAt(0)}
                            </div>
                            <div>
                              <div
                                className="font-bold text-gray-800 hover:underline cursor-pointer"
                                style={{ color: branding.primaryColor }}
                              >
                                {row.name}
                              </div>
                              <div className="text-[10px] text-gray-400 font-bold flex items-center gap-1 mt-0.5">
                                <Phone size={10} /> {row.phone}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center border-r border-gray-50">
                          <span className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-black">
                            {row.date}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center border-r border-gray-50">
                          <span className="px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-[10px] font-black">
                            {row.time}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-gray-800 font-bold text-xs">
                            {row.assignedTo}
                          </div>
                          <div className="text-[10px] text-gray-400 mt-1 line-clamp-1">
                            {row.note || 'No additional notes provided'}
                          </div>
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
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col min-h-[350px] mb-6 overflow-hidden">
          <div className="p-5 flex justify-between items-center border-b border-gray-50 bg-gray-50/20">
            <div className="flex gap-2">
              <button className="bg-white border border-gray-200 text-gray-600 p-2 rounded-xl hover:bg-gray-50 transition-all shadow-sm">
                <ChevronLeft size={16} />
              </button>
              <button className="bg-white border border-gray-200 text-gray-600 p-2 rounded-xl hover:bg-gray-50 transition-all shadow-sm">
                <ChevronRight size={16} />
              </button>
              <button
                className="px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-transform active:scale-95"
                style={{ backgroundColor: branding.primaryColor }}
              >
                Today
              </button>
            </div>
            <div className="font-black text-gray-800 tracking-tighter text-lg uppercase">
              MARCH 2026
            </div>
            <div className="flex bg-gray-100 p-1 rounded-xl">
              {['Month', 'Week', 'Day'].map((view) => (
                <button
                  key={view}
                  className={`px-4 py-1.5 text-[10px] font-bold rounded-lg transition-all ${view === 'Month' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  {view}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 p-8 flex flex-col items-center justify-center text-gray-300">
            <Calendar size={64} className="mb-4 opacity-10" />
            <p className="font-bold uppercase tracking-widest text-[10px]">
              Calendar Visualization Placeholder
            </p>
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-full xl:w-96 flex flex-col gap-6 flex-shrink-0 animate-fade-in">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col">
          <h3
            className="text-[10px] font-black uppercase tracking-[0.2em] mb-6 px-1 pb-2 border-b border-gray-50"
            style={{ color: branding.primaryColor }}
          >
            Event Logistics
          </h3>
          <div className="space-y-6">
            <div className="flex gap-4 group">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black text-sm shrink-0 shadow-lg group-hover:rotate-12 transition-transform"
                style={{ backgroundColor: '#f43f5e' }}
              >
                H
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-gray-800 group-hover:underline cursor-pointer line-clamp-2">
                  Sweden : Late Application Courses Available for Fall 2026
                </p>
                <p className="text-[10px] text-gray-400 font-bold mt-2 flex items-center gap-1">
                  <Clock size={10} /> 1 week ago
                </p>
              </div>
            </div>
            <div className="flex gap-4 group">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black text-sm shrink-0 shadow-lg group-hover:rotate-12 transition-transform"
                style={{ backgroundColor: branding.primaryColor }}
              >
                A
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-gray-800 group-hover:underline cursor-pointer line-clamp-2">
                  UK University Fair - London Met University Visit
                </p>
                <p className="text-[10px] text-gray-400 font-bold mt-2 flex items-center gap-1">
                  <Clock size={10} /> 2 days ago
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#1e293b] rounded-2xl p-6 text-white shadow-xl relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 opacity-50">
            Internal Reminder
          </h3>
          <div className="flex-1 flex flex-col justify-center gap-4">
            <p className="text-sm font-bold leading-relaxed">
              No pending reminders for your department today.
            </p>
            <button className="text-[10px] font-black uppercase tracking-widest py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all w-fit px-4 border border-white/10">
              Set New Reminder
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex-1 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3
              className="text-[10px] font-black uppercase tracking-[0.2em]"
              style={{ color: branding.primaryColor }}
            >
              Priority Tasks
            </h3>
            <span className="bg-gray-100 text-gray-400 text-[9px] font-black px-2 py-0.5 rounded-md">
              3 PENDING
            </span>
          </div>
          <div className="space-y-4 flex-1">
            <div
              className="flex gap-4 items-start border-l-4 pl-4 py-1"
              style={{ borderColor: branding.primaryColor }}
            >
              <div className="w-8 h-8 rounded-xl bg-purple-500 text-white flex items-center justify-center text-[10px] font-black shrink-0 shadow-sm">
                DOC
              </div>
              <div className="flex-1">
                <p
                  className="text-[10px] font-bold"
                  style={{ color: branding.primaryColor }}
                >
                  June 27, 2026
                </p>
                <p className="text-xs font-black text-gray-800 mt-0.5">
                  Collect pending documents from Rohan
                </p>
              </div>
              <div
                className="w-5 h-5 border-2 border-gray-200 rounded-full shrink-0 cursor-pointer hover:border-current"
                style={{
                  '--tw-border-opacity': '0.3',
                  color: branding.primaryColor,
                }}
              ></div>
            </div>
          </div>
          <button className="w-full mt-6 py-3 border-2 border-dashed border-gray-100 rounded-xl text-gray-400 text-[10px] font-bold hover:bg-gray-50 transition-all uppercase tracking-widest">
            + Add New Global Task
          </button>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 4px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background: #cbd5e1;
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default DashboardPage;

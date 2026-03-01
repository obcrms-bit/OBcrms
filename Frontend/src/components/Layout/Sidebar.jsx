import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Home, PhoneCall, CalendarClock, UserPlus, GraduationCap,
  PieChart, BookOpen, Receipt, BookMarked, Mail, MailCheck,
  Plane, Search, CheckSquare, Bell, FileText, Star,
  UserCheck, CalendarDays, Calendar, Users, Ticket,
  Settings, UserCog, UsersRound, DollarSign, Sliders, FileJson2,
  ChevronRight, ChevronDown, LogOut
} from 'lucide-react';

const SidebarItem = ({ icon: Icon, label, badge, active, hasSubmenu }) => (
  <div className={`flex items-center justify-between px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm ${active ? 'text-primary-600 font-medium bg-blue-50/50' : 'text-gray-700'}`}>
    <div className="flex items-center gap-3">
      <Icon size={18} className={active ? 'text-blue-500' : 'text-gray-500'} />
      <span>{label}</span>
    </div>
    <div className="flex items-center gap-2">
      {badge !== undefined && (
        <span className="bg-cyan-400 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
          {badge}
        </span>
      )}
      {hasSubmenu && <ChevronRight size={14} className="text-gray-400" />}
    </div>
  </div>
);

const SidebarSection = ({ title }) => (
  <div className="px-4 py-2 mt-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
    {title}
  </div>
);

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}>
        {/* Logo Area */}
        <div className="h-16 flex items-center justify-center border-b border-gray-100 px-4">
          <div className="text-2xl font-bold text-blue-500">
            Education<span className="text-cyan-400">CRM</span>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
          <SidebarItem icon={Home} label="Dashboard" active />

          <SidebarItem icon={PhoneCall} label="Call Management" badge={0} />
          <SidebarItem icon={CalendarClock} label="Scheduled Followup" badge={0} hasSubmenu />
          <SidebarItem icon={UserPlus} label="Lead/ Registrations" hasSubmenu />
          <SidebarItem icon={GraduationCap} label="Student" hasSubmenu />
          <SidebarItem icon={PieChart} label="Lead by Category" hasSubmenu />
          <SidebarItem icon={BookOpen} label="Class" />
          <SidebarItem icon={Receipt} label="Payment Record" hasSubmenu />
          <SidebarItem icon={BookMarked} label="Application Shortlist" hasSubmenu />
          <SidebarItem icon={Mail} label="Offer Letter" hasSubmenu />
          <SidebarItem icon={MailCheck} label="Acceptance Letter" hasSubmenu />
          <SidebarItem icon={Plane} label="Visa" hasSubmenu />
          <SidebarItem icon={Search} label="Course Finder" />
          <SidebarItem icon={CheckSquare} label="Task" />
          <SidebarItem icon={Bell} label="Reminder" hasSubmenu />
          <SidebarItem icon={FileText} label="Report" hasSubmenu />
          <SidebarItem icon={Star} label="Highlights" />

          <SidebarSection title="CRM" />
          <SidebarItem icon={UserCheck} label="Attendance" hasSubmenu />
          <SidebarItem icon={CalendarDays} label="Leave" hasSubmenu />
          <SidebarItem icon={Calendar} label="Calendar" />
          <SidebarItem icon={Users} label="Meeting & Events" hasSubmenu />
          <SidebarItem icon={Ticket} label="Raise Ticket" />

          <SidebarSection title="SETTING" />
          <SidebarItem icon={Settings} label="Setup" hasSubmenu />
          <SidebarItem icon={UserCog} label="Employee" hasSubmenu />
          <SidebarItem icon={UsersRound} label="User Management" hasSubmenu />
          <SidebarItem icon={DollarSign} label="Cash Received" />
          <SidebarItem icon={Sliders} label="Setting" />
          <SidebarItem icon={FileJson2} label="Newsletter Template" hasSubmenu />
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-gray-200">
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-500 w-full px-2 py-2">
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

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
      `}</style>
    </>
  );
};

export default Sidebar;

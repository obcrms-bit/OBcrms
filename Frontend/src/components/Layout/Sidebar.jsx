import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useBranding } from '../../context/BrandingContext';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home, PhoneCall, CalendarClock, UserPlus, GraduationCap,
  PieChart, BookOpen, Receipt, BookMarked, Mail, MailCheck,
  Plane, Search, CheckSquare, Bell, FileText, Star,
  UserCheck, CalendarDays, Calendar, Users, Ticket,
  Settings, UserCog, UsersRound, DollarSign, Sliders, FileJson2,
  ChevronRight, ChevronDown, LogOut
} from 'lucide-react';

const SidebarItem = ({ icon: Icon, label, badge, active, hasSubmenu, primaryColor, onClick }) => (
  <div
    onClick={onClick}
    className={`flex items-center justify-between px-4 py-2.5 cursor-pointer text-sm transition-all duration-200 group ${active
      ? 'font-bold bg-opacity-10'
      : 'text-gray-600 hover:bg-gray-50'
      }`}
    style={active ? { backgroundColor: `${primaryColor}15`, color: primaryColor, borderLeft: `3px solid ${primaryColor}` } : {}}
  >
    <div className="flex items-center gap-3">
      <Icon size={18} className={active ? '' : 'text-gray-500 group-hover:text-gray-700'} style={active ? { color: primaryColor } : {}} />
      <span>{label}</span>
    </div>
    <div className="flex items-center gap-2">
      {badge !== undefined && badge > 0 && (
        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
          {badge}
        </span>
      )}
      {hasSubmenu && <ChevronRight size={14} className={active ? '' : 'text-gray-400 group-hover:text-gray-600'} style={active ? { color: primaryColor } : {}} />}
    </div>
  </div>
);

const SidebarSection = ({ title }) => (
  <div className="px-4 py-3 mt-4 text-[11px] font-bold text-gray-400 uppercase tracking-[0.1em] border-b border-gray-50 mb-1">
    {title}
  </div>
);

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user, logout } = useAuth();
  const { branding } = useBranding();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-100 shadow-xl transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}>
        {/* Logo Area */}
        <div className="h-16 flex items-center gap-3 border-b border-gray-50 px-6 overflow-hidden">
          {branding.logo ? (
            <img src={branding.logo} alt="Logo" className="h-8 w-8 object-contain" />
          ) : (
            <div className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-inner" style={{ backgroundColor: branding.primaryColor }}>
              {branding.name?.charAt(0)}
            </div>
          )}
          <div className="flex flex-col whitespace-nowrap">
            <span className="text-sm font-bold text-gray-800 leading-tight truncate max-w-[140px]">{branding.name}</span>
            <span className="text-[10px] text-gray-400 font-medium uppercase tracking-tighter">Educational Portal</span>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
          <SidebarItem
            icon={Home}
            label="Dashboard"
            active={isActive('/admin') || isActive('/counselor')}
            primaryColor={branding.primaryColor}
            onClick={() => navigate(user?.role === 'admin' ? '/admin' : '/counselor')}
          />

          <SidebarItem
            icon={PhoneCall}
            label="Call Management"
            badge={0}
            active={isActive('/admin/calls') || isActive('/counselor/calls')}
            primaryColor={branding.primaryColor}
          />
          {(user?.role === 'admin' || user?.role === 'sales' || user?.role === 'manager') && (
            <SidebarItem
              icon={UserPlus}
              label="Lead Management"
              active={isActive('/admin/leads') || isActive('/counselor/leads')}
              primaryColor={branding.primaryColor}
              onClick={() => navigate(user?.role === 'admin' ? '/admin/leads' : `/${user?.role}/leads`)}
            />
          )}

          {(user?.role === 'admin' || user?.role === 'sales' || user?.role === 'manager' || user?.role === 'counselor') && (
            <SidebarItem
              icon={GraduationCap}
              label="Students"
              active={isActive('/admin/students') || isActive('/counselor/students')}
              primaryColor={branding.primaryColor}
              onClick={() => navigate(user?.role === 'admin' ? '/admin/students' : `/${user?.role}/students`)}
            />
          )}

          <SidebarSection title="OPERATIONS" />
          {(user?.role === 'admin' || user?.role === 'manager' || user?.role === 'counselor') && (
            <SidebarItem
              icon={BookMarked}
              label="Applications"
              active={isActive('/admin/applicants') || isActive('/counselor/applicants')}
              primaryColor={branding.primaryColor}
              onClick={() => navigate(user?.role === 'admin' ? '/admin/applicants' : `/${user?.role}/applicants`)}
            />
          )}

          {(user?.role === 'admin' || user?.role === 'accountant') && (
            <SidebarItem
              icon={Receipt}
              label="Billing & Invoices"
              active={isActive('/admin/invoices') || isActive('/accountant/invoices')}
              primaryColor={branding.primaryColor}
              onClick={() => navigate(user?.role === 'admin' ? '/admin/invoices' : '/accountant/invoices')}
            />
          )}

          {(user?.role === 'admin' || user?.role === 'manager' || user?.role === 'counselor') && (
            <SidebarItem icon={Plane} label="Visa Processing" primaryColor={branding.primaryColor} />
          )}


          <SidebarSection title="CRM" />
          <SidebarItem icon={UserCheck} label="Attendance" hasSubmenu primaryColor={branding.primaryColor} />
          <SidebarItem icon={CalendarDays} label="Leave" hasSubmenu primaryColor={branding.primaryColor} />
          <SidebarItem icon={Users} label="Meeting & Events" hasSubmenu primaryColor={branding.primaryColor} />
          <SidebarItem icon={Ticket} label="Raise Ticket" primaryColor={branding.primaryColor} />

          {user?.role === 'admin' && (
            <>
              <SidebarSection title="SETTING" />
              <SidebarItem
                icon={Sliders}
                label="System Settings"
                active={isActive('/admin/settings')}
                primaryColor={branding.primaryColor}
                onClick={() => navigate('/admin/settings')}
              />
              <SidebarItem icon={UserCog} label="Employee" hasSubmenu primaryColor={branding.primaryColor} />
              <SidebarItem icon={UsersRound} label="User Management" hasSubmenu primaryColor={branding.primaryColor} />
            </>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-gray-50 bg-gray-50/50">
          <div className="flex items-center gap-3 px-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs uppercase">
              {user?.name?.substring(0, 2)}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-gray-700 truncate">{user?.name}</span>
              <span className="text-[10px] text-gray-500 uppercase font-medium">{user?.role}</span>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-500 transition-colors w-full px-2 py-2 font-medium">
            <LogOut size={18} />
            <span>Logout System</span>
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

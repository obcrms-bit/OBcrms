import React, { useState } from 'react';
import Image from 'next/image';
import { useAuth } from '../../context/AuthContext';
import { useBranding } from '../../context/BrandingContext';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  PhoneCall,
  CalendarClock,
  UserPlus,
  GraduationCap,
  PieChart,
  BookOpen,
  Receipt,
  BookMarked,
  Mail,
  MailCheck,
  Plane,
  Search,
  CheckSquare,
  Bell,
  FileText,
  Star,
  UserCheck,
  CalendarDays,
  Calendar,
  Users,
  Ticket,
  Settings,
  UserCog,
  UsersRound,
  DollarSign,
  Sliders,
  FileJson2,
  ChevronRight,
  ChevronDown,
  LogOut,
} from 'lucide-react';

const SidebarItem = ({
  icon: Icon,
  label,
  badge,
  active,
  hasSubmenu,
  primaryColor,
  onClick,
}) => (
  <div
    onClick={onClick}
    className={`flex items-center justify-between px-4 py-2.5 cursor-pointer text-sm transition-all duration-200 group ${
      active ? 'font-bold bg-opacity-10' : 'text-gray-600 hover:bg-gray-50'
    }`}
    style={
      active
        ? {
            backgroundColor: `${primaryColor}15`,
            color: primaryColor,
            borderLeft: `3px solid ${primaryColor}`,
          }
        : {}
    }
  >
    <div className="flex items-center gap-3">
      <Icon
        size={18}
        className={active ? '' : 'text-gray-500 group-hover:text-gray-700'}
        style={active ? { color: primaryColor } : {}}
      />
      <span>{label}</span>
    </div>
    <div className="flex items-center gap-2">
      {badge !== undefined && badge > 0 && (
        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
          {badge}
        </span>
      )}
      {hasSubmenu && (
        <ChevronRight
          size={14}
          className={active ? '' : 'text-gray-400 group-hover:text-gray-600'}
          style={active ? { color: primaryColor } : {}}
        />
      )}
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

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + '/');
  const base = user?.role === 'super_admin' ? 'admin' : user?.role || 'admin';
  const nav = (path) => navigate(`/${base}${path}`);

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-100 shadow-xl transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}
      >
        {/* Logo Area */}
        <div className="h-16 flex items-center gap-3 border-b border-gray-50 px-6 overflow-hidden">
          {branding.logo ? (
            <Image
              src={branding.logo}
              alt="Logo"
              width={32}
              height={32}
              unoptimized
              className="h-8 w-8 object-contain"
            />
          ) : (
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-inner"
              style={{ backgroundColor: branding.primaryColor }}
            >
              {branding.name?.charAt(0)}
            </div>
          )}
          <div className="flex flex-col whitespace-nowrap">
            <span className="text-sm font-bold text-gray-800 leading-tight truncate max-w-[140px]">
              {branding.name}
            </span>
            <span className="text-[10px] text-gray-400 font-medium uppercase tracking-tighter">
              Educational Portal
            </span>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
          <SidebarItem
            icon={Home}
            label="Dashboard"
            active={location.pathname === `/${base}`}
            primaryColor={branding.primaryColor}
            onClick={() => nav('')}
          />

          <SidebarItem
            icon={PhoneCall}
            label="Call Management"
            badge={0}
            active={isActive('/admin/calls') || isActive('/counselor/calls')}
            primaryColor={branding.primaryColor}
          />
          {/* CRM Section */}
          <SidebarSection title="CRM" />
          {(user?.role === 'super_admin' ||
            user?.role === 'admin' ||
            user?.role === 'sales' ||
            user?.role === 'manager' ||
            user?.role === 'counselor') && (
            <SidebarItem
              icon={UserPlus}
              label="Leads"
              active={isActive(`/${base}/leads`)}
              primaryColor={branding.primaryColor}
              onClick={() => nav('/leads')}
            />
          )}
          {(user?.role === 'super_admin' ||
            user?.role === 'admin' ||
            user?.role === 'sales' ||
            user?.role === 'manager' ||
            user?.role === 'counselor') && (
            <SidebarItem
              icon={PieChart}
              label="Pipeline Board"
              active={isActive(`/${base}/leads/pipeline`)}
              primaryColor={branding.primaryColor}
              onClick={() => nav('/leads/pipeline')}
            />
          )}

          {(user?.role === 'super_admin' ||
            user?.role === 'admin' ||
            user?.role === 'sales' ||
            user?.role === 'manager' ||
            user?.role === 'counselor') && (
            <SidebarItem
              icon={GraduationCap}
              label="Students"
              active={isActive(`/${base}/students`)}
              primaryColor={branding.primaryColor}
              onClick={() => nav('/students')}
            />
          )}

          <SidebarSection title="OPERATIONS" />
          {(user?.role === 'super_admin' ||
            user?.role === 'admin' ||
            user?.role === 'manager' ||
            user?.role === 'counselor') && (
            <SidebarItem
              icon={Plane}
              label="Visa Applications"
              active={isActive(`/${base}/visa`)}
              primaryColor={branding.primaryColor}
              onClick={() => nav('/visa')}
            />
          )}

          {(user?.role === 'super_admin' ||
            user?.role === 'admin' ||
            user?.role === 'manager' ||
            user?.role === 'counselor') && (
            <SidebarItem
              icon={BookMarked}
              label="University Apps"
              active={isActive(`/${base}/applicants`)}
              primaryColor={branding.primaryColor}
              onClick={() => nav('/applicants')}
            />
          )}

          {(user?.role === 'super_admin' ||
            user?.role === 'admin' ||
            user?.role === 'accountant') && (
            <SidebarItem
              icon={Receipt}
              label="Billing & Invoices"
              active={isActive(`/${base}/invoices`)}
              primaryColor={branding.primaryColor}
              onClick={() => nav('/invoices')}
            />
          )}

          <SidebarSection title="HR" />
          <SidebarItem
            icon={UserCheck}
            label="Attendance"
            hasSubmenu
            primaryColor={branding.primaryColor}
          />
          <SidebarItem
            icon={CalendarDays}
            label="Leave"
            hasSubmenu
            primaryColor={branding.primaryColor}
          />
          <SidebarItem
            icon={Users}
            label="Meetings & Events"
            hasSubmenu
            primaryColor={branding.primaryColor}
          />
          <SidebarItem
            icon={Ticket}
            label="Raise Ticket"
            primaryColor={branding.primaryColor}
          />

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
              <SidebarItem
                icon={UserCog}
                label="Employee"
                hasSubmenu
                primaryColor={branding.primaryColor}
              />
              <SidebarItem
                icon={UsersRound}
                label="User Management"
                hasSubmenu
                primaryColor={branding.primaryColor}
              />
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
              <span className="text-sm font-bold text-gray-700 truncate">
                {user?.name}
              </span>
              <span className="text-[10px] text-gray-500 uppercase font-medium">
                {user?.role}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-500 transition-colors w-full px-2 py-2 font-medium"
          >
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

'use client';

import { useState } from 'react';
import {
  BarChart,
  Phone,
  Calendar,
  Users,
  User,
  FileText,
  Eye,
  Clock,
  Settings,
  Menu,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const sidebarItems = [
  { name: 'Dashboard', icon: BarChart, active: true },
  { name: 'Call Management', icon: Phone },
  { name: 'Scheduled Followup', icon: Calendar },
  { name: 'Leads / Registrations', icon: Users },
  { name: 'Students', icon: Users },
  { name: 'Agents', icon: User },
  { name: 'Partners', icon: Users },
  { name: 'Universities', icon: FileText },
  { name: 'Applications', icon: FileText },
  { name: 'Offer Letter', icon: FileText },
  { name: 'Visa', icon: FileText },
  { name: 'Invoice', icon: FileText },
  { name: 'Commission', icon: FileText },
  { name: 'Calendar', icon: Calendar },
  { name: 'Tasks', icon: FileText },
  { name: 'Reminder', icon: Phone },
  { name: 'Reports', icon: BarChart },
  { name: 'Highlights', icon: Eye },
  { name: 'Attendance', icon: Clock },
  { name: 'Leave', icon: Calendar },
  { name: 'Settings', icon: Settings },
];

export default function Sidebar({ collapsed, setCollapsed }) {
  return (
    <div
      className={cn(
        'fixed left-0 top-0 z-40 h-screen transition-all duration-300 bg-white shadow-lg dark:bg-gray-800',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          {!collapsed && (
            <h2 className="text-xl font-bold dark:text-white">TrustEdu</h2>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {sidebarItems.map((item) => (
            <Button
              key={item.name}
              variant={item.active ? 'default' : 'ghost'}
              className={cn(
                'w-full justify-start hover:bg-gray-100 dark:hover:bg-gray-700',
                collapsed ? 'px-2' : ''
              )}
            >
              <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />
              {!collapsed && <span className="truncate">{item.name}</span>}
            </Button>
          ))}
        </nav>
      </div>
    </div>
  );
}

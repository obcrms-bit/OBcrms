'use client';

import React from 'react';
import Link from 'next/link';
import { useTheme } from '@/ThemeContext';
import { LayoutDashboard, PhoneCall, Users, GraduationCap, ClipboardList, CreditCard, Building, Settings, PieChart } from 'lucide-react';

const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Leads & Pipeline', href: '/dashboard/leads', icon: Users },
    { name: 'Students', href: '/dashboard/students', icon: GraduationCap },
    { name: 'Applications', href: '/dashboard/applications', icon: ClipboardList },
    { name: 'Follow-ups', href: '/dashboard/followups', icon: PhoneCall },
    { name: 'Branches', href: '/dashboard/branches', icon: Building },
    { name: 'Invoices', href: '/dashboard/invoices', icon: CreditCard },
    { name: 'Reports', href: '/dashboard/reports', icon: PieChart },
    { name: 'Company Settings', href: '/dashboard/settings', icon: Settings },
];

export default function TenantAdminSidebar() {
    const { theme } = useTheme();

    return (
        <aside className="w-64 min-h-screen flex flex-col fixed left-0 top-0 overflow-y-auto z-20 shadow-lg" style={{ backgroundColor: theme.secondaryColor }}>
            <div className="p-4 flex flex-col justify-center h-20 sticky top-0 bg-black/20">
                <span className="text-xl font-bold text-white tracking-wider truncate">
                    {theme.companyName}
                </span>
                <span className="text-[10px] text-white/50 uppercase tracking-widest mt-1">Operations Console</span>
            </div>
            <nav className="flex-1 px-3 py-6 space-y-1">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className="flex items-center px-3 py-2.5 text-sm font-medium rounded-md hover:bg-white/10 text-white/80 hover:text-white transition-colors group"
                        >
                            <Icon className="mr-3 flex-shrink-0 h-5 w-5 opacity-70 group-hover:opacity-100" />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}
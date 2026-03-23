'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { Role } from '@/lib/types/auth';
import { LayoutDashboard, PhoneCall, CalendarClock, Users, UserPlus, GraduationCap, ClipboardList, BookOpen, CreditCard, FileCheck, Mail, Map, Target, Bell, BarChart, Star, ShieldAlert, Building2, UploadCloud } from 'lucide-react';

interface NavItem {
    name: string;
    href: string;
    icon: React.ElementType;
    allowedRoles: Role[];
}

const navItems: NavItem[] = [
    { name: 'Owner Console', href: '/super-admin', icon: ShieldAlert, allowedRoles: ['SUPER_ADMIN'] },
    { name: 'Tenants Config', href: '/super-admin/tenants', icon: Building2, allowedRoles: ['SUPER_ADMIN'] },
    { name: 'Onboarding Imports', href: '/super-admin/onboarding', icon: UploadCloud, allowedRoles: ['SUPER_ADMIN'] },
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'STAFF'] },
    { name: 'Call Management', href: '/calls', icon: PhoneCall, allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'STAFF'] },
    { name: 'Scheduled Followup', href: '/followup', icon: CalendarClock, allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'STAFF'] },
    { name: 'Lead/Registrations', href: '/leads', icon: UserPlus, allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'STAFF'] },
    { name: 'Student', href: '/students', icon: GraduationCap, allowedRoles: ['SUPER_ADMIN', 'ADMIN'] },
    { name: 'Lead by Category', href: '/leads/category', icon: Users, allowedRoles: ['SUPER_ADMIN', 'ADMIN'] },
    { name: 'Class', href: '/classes', icon: BookOpen, allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'STAFF'] },
    { name: 'Payment Record', href: '/payments', icon: CreditCard, allowedRoles: ['SUPER_ADMIN', 'ADMIN'] },
    { name: 'Application Shortlist', href: '/applications', icon: ClipboardList, allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'STAFF'] },
    { name: 'Offer Letter', href: '/offers', icon: FileCheck, allowedRoles: ['SUPER_ADMIN', 'ADMIN'] },
    { name: 'Acceptance Letter', href: '/acceptance', icon: Mail, allowedRoles: ['SUPER_ADMIN', 'ADMIN'] },
    { name: 'Visa', href: '/visa', icon: Map, allowedRoles: ['SUPER_ADMIN', 'ADMIN'] },
    { name: 'Course Finder', href: '/courses', icon: Target, allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'STAFF'] },
    { name: 'Task', href: '/tasks', icon: ClipboardList, allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'STAFF'] },
    { name: 'Reminder', href: '/reminders', icon: Bell, allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'STAFF'] },
    { name: 'Report', href: '/reports', icon: BarChart, allowedRoles: ['SUPER_ADMIN'] },
    { name: 'Highlights', href: '/highlights', icon: Star, allowedRoles: ['SUPER_ADMIN', 'ADMIN'] },
];

export default function Sidebar() {
    const { hasRole, isLoading } = useAuth();

    if (isLoading) return <div className="w-64 bg-gray-900 min-h-screen" />;

    return (
        <aside className="w-64 bg-slate-900 text-slate-300 min-h-screen flex flex-col fixed left-0 top-0 overflow-y-auto z-20">
            <div className="p-4 bg-slate-950 flex items-center justify-center h-16 sticky top-0">
                <span className="text-xl font-bold text-white tracking-wider">TRUST CRM</span>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1">
                {navItems.map((item) => {
                    if (!hasRole(item.allowedRoles)) return null;
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className="flex items-center px-3 py-2.5 text-sm font-medium rounded-md hover:bg-slate-800 hover:text-white transition-colors group"
                        >
                            <Icon className="mr-3 flex-shrink-0 h-5 w-5 text-slate-400 group-hover:text-white" />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}
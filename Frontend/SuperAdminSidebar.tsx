'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, Building2, UploadCloud, FileText, Settings, Palette, Activity } from 'lucide-react';

const navItems = [
    { name: 'Control Tower', href: '/super-admin', icon: ShieldAlert },
    { name: 'Tenant Companies', href: '/super-admin/tenants', icon: Building2 },
    { name: 'Onboarding Imports', href: '/super-admin/onboarding', icon: UploadCloud },
    { name: 'Platform Analytics', href: '/super-admin/analytics', icon: Activity },
    { name: 'Brand & White-Label', href: '/super-admin/branding', icon: Palette },
    { name: 'Audit Center', href: '/super-admin/audit', icon: FileText },
    { name: 'Global Settings', href: '/super-admin/settings', icon: Settings },
];

export default function SuperAdminSidebar() {
    return (
        <aside className="w-64 bg-slate-950 text-slate-300 min-h-screen flex flex-col fixed left-0 top-0 overflow-y-auto z-20 border-r border-slate-800">
            <div className="p-4 bg-black flex flex-col justify-center h-20 sticky top-0 border-b border-slate-800">
                <span className="text-xl font-bold text-white tracking-wider flex items-center">
                    <ShieldAlert className="w-5 h-5 mr-2 text-indigo-500" />
                    PLATFORM OS
                </span>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Super Admin Console</span>
            </div>
            <nav className="flex-1 px-3 py-6 space-y-1">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className="flex items-center px-3 py-2.5 text-sm font-medium rounded-md hover:bg-indigo-600/20 hover:text-indigo-400 transition-colors group"
                        >
                            <Icon className="mr-3 flex-shrink-0 h-5 w-5 text-slate-500 group-hover:text-indigo-400" />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, Filter, MoreVertical, Edit, Ban, PlayCircle, Eye } from 'lucide-react';

const mockTenants = [
    { id: 'T-1001', name: 'Global Edu Consult', country: 'Australia', branches: 4, admin: 'Sarah Jenkins', employees: 24, status: 'Active', setup: 100 },
    { id: 'T-1002', name: 'Future Path Migration', country: 'Canada', branches: 2, admin: 'Michael Chen', employees: 12, status: 'Active', setup: 100 },
    { id: 'T-1003', name: 'Apex Studies', country: 'UK', branches: 1, admin: 'Unassigned', employees: 0, status: 'Onboarding', setup: 40 },
    { id: 'T-1004', name: 'Visa Experts Hub', country: 'USA', branches: 8, admin: 'David Smith', employees: 65, status: 'Suspended', setup: 100 },
    { id: 'T-1005', name: 'NextGen Education', country: 'Nepal', branches: 3, admin: 'Anil Gurung', employees: 18, status: 'Active', setup: 85 },
];

export default function TenantList() {
    const [search, setSearch] = useState('');

    return (
        <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Tenants Configuration</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage all consultancy accounts across the platform.</p>
                </div>
                <Link href="/super-admin/onboarding">
                    <button className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm">
                        + Create / Import Tenant
                    </button>
                </Link>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <div className="relative w-96">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by ID, Name or Admin..."
                            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                        <Filter className="w-4 h-4 mr-2" /> Filter
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500">
                                <th className="px-6 py-4 font-semibold">Tenant Name</th>
                                <th className="px-6 py-4 font-semibold">HQ / Country</th>
                                <th className="px-6 py-4 font-semibold">Admin Owner</th>
                                <th className="px-6 py-4 font-semibold">Scale</th>
                                <th className="px-6 py-4 font-semibold">Setup %</th>
                                <th className="px-6 py-4 font-semibold">Status</th>
                                <th className="px-6 py-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {mockTenants.map((t) => (
                                <tr key={t.id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <div className="w-8 h-8 rounded bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs mr-3">
                                                {t.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                                                <p className="text-xs text-gray-500">{t.id}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{t.country}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {t.admin === 'Unassigned' ? <span className="text-rose-500 font-medium">Unassigned</span> : t.admin}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {t.branches} Branches<br /><span className="text-xs text-gray-400">{t.employees} Staff</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-full bg-gray-200 rounded-full h-2 max-w-[80px]">
                                                <div className={`h-2 rounded-full ${t.setup === 100 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${t.setup}%` }}></div>
                                            </div>
                                            <span className="text-xs text-gray-600 font-medium">{t.setup}%</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${t.status === 'Active' ? 'bg-emerald-100 text-emerald-700' :
                                                t.status === 'Suspended' ? 'bg-rose-100 text-rose-700' :
                                                    'bg-amber-100 text-amber-700'
                                            }`}>
                                            {t.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Link href={`/super-admin/tenants/${t.id}`} className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded"><Eye className="w-4 h-4" /></Link>
                                            <button className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"><Edit className="w-4 h-4" /></button>
                                            {t.status === 'Suspended' ? <button className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded"><PlayCircle className="w-4 h-4" /></button> : <button className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded"><Ban className="w-4 h-4" /></button>}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
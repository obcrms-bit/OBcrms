'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Building2, MapPin, Users, Key, PlayCircle, Settings, ShieldAlert, FileCheck, CheckCircle2 } from 'lucide-react';

export default function TenantDetail({ tenantId }: { tenantId: string }) {
    const [activeTab, setActiveTab] = useState('Overview');
    const tabs = ['Overview', 'Branches', 'Roles & Users', 'Automations', 'Import Logs', 'Billing'];

    const completionSteps = [
        { name: 'Company Info', done: true },
        { name: 'Branch Mapping', done: true },
        { name: 'Roles & Permissions', done: true },
        { name: 'Admin Assignment', done: true },
        { name: 'Employee Import', done: false },
        { name: 'Services & Workflows', done: false },
    ];

    return (
        <div className="max-w-6xl mx-auto animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center space-x-4 mb-6">
                <Link href="/super-admin/tenants" className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                </Link>
                <div>
                    <div className="flex items-center space-x-3">
                        <h1 className="text-2xl font-bold text-gray-900">Global Edu Consult</h1>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Active</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Tenant ID: {tenantId} | Created: Sep 12, 2023</p>
                </div>
                <div className="ml-auto flex space-x-3">
                    <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">Suspend Tenant</button>
                    <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm transition-colors flex items-center">
                        <PlayCircle className="w-4 h-4 mr-2" />
                        Impersonate Admin
                    </button>
                </div>
            </div>

            {/* Setup Progress */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-gray-800">Setup Completion</h3>
                    <span className="text-sm font-bold text-indigo-600">66%</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    {completionSteps.map((step, idx) => (
                        <div key={idx} className="flex flex-col items-center text-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 border-2 ${step.done ? 'bg-emerald-50 border-emerald-500 text-emerald-500' : 'bg-gray-50 border-gray-200 text-gray-300'}`}>
                                {step.done ? <CheckCircle2 className="w-5 h-5" /> : <span className="text-xs font-bold">{idx + 1}</span>}
                            </div>
                            <span className={`text-xs ${step.done ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>{step.name}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex border-b border-gray-100 overflow-x-auto">
                    {tabs.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${activeTab === tab ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="p-6">
                    {activeTab === 'Overview' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                                <div className="flex items-center text-gray-500 mb-2"><Building2 className="w-4 h-4 mr-2" /> Total Branches</div>
                                <p className="text-2xl font-bold text-gray-800">4</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                                <div className="flex items-center text-gray-500 mb-2"><Users className="w-4 h-4 mr-2" /> Employees</div>
                                <p className="text-2xl font-bold text-gray-800">24</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                                <div className="flex items-center text-gray-500 mb-2"><ShieldAlert className="w-4 h-4 mr-2" /> Owner Admin</div>
                                <p className="text-sm font-bold text-gray-800 mt-1">Sarah Jenkins</p>
                                <p className="text-xs text-gray-500">sarah@globaledu.com</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                                <div className="flex items-center text-gray-500 mb-2"><MapPin className="w-4 h-4 mr-2" /> Head Office</div>
                                <p className="text-sm font-bold text-gray-800 mt-1">Sydney, NSW</p>
                                <p className="text-xs text-gray-500">Australia</p>
                            </div>
                        </div>
                    )}

                    {activeTab !== 'Overview' && (
                        <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500">
                            {activeTab === 'Branches' && <Building2 className="w-12 h-12 mb-4 text-gray-300" />}
                            {activeTab === 'Roles & Users' && <Users className="w-12 h-12 mb-4 text-gray-300" />}
                            {activeTab === 'Automations' && <Settings className="w-12 h-12 mb-4 text-gray-300" />}
                            {activeTab === 'Import Logs' && <FileCheck className="w-12 h-12 mb-4 text-gray-300" />}

                            <h3 className="text-lg font-medium text-gray-800 mb-2">{activeTab} Details</h3>
                            <p className="max-w-md">Detailed configuration and listing for {activeTab.toLowerCase()} scoped to this tenant will be displayed here.</p>

                            {activeTab === 'Branches' && (
                                <div className="mt-6 flex space-x-3">
                                    <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 shadow-sm hover:bg-gray-50">View Branch List</button>
                                    <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm shadow-sm hover:bg-indigo-700">Map New Branch</button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
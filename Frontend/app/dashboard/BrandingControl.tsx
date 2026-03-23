'use client';

import React, { useState } from 'react';
import { Palette, CheckCircle, Globe, Image as ImageIcon } from 'lucide-react';

export default function BrandingControl() {
    const [primary, setPrimary] = useState('#4f46e5');
    const [secondary, setSecondary] = useState('#1e293b');
    const [tenantName, setTenantName] = useState('Global Edu Consult');

    return (
        <div className="max-w-6xl mx-auto animate-in fade-in duration-500">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">White-Label Engine</h1>
                <p className="text-sm text-gray-500 mt-1">Configure default branding templates and override specific tenant UI properties.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Config Form */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="font-semibold text-gray-800 mb-4 flex items-center"><Palette className="w-4 h-4 mr-2" /> Theme Settings</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Company / Tenant Name</label>
                                <input type="text" value={tenantName} onChange={(e) => setTenantName(e.target.value)} className="w-full text-sm border-gray-300 rounded-md shadow-sm p-2 border focus:ring-indigo-500 focus:border-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Primary Color (Buttons, Accents)</label>
                                <div className="flex space-x-2">
                                    <input type="color" value={primary} onChange={(e) => setPrimary(e.target.value)} className="h-9 w-12 rounded cursor-pointer" />
                                    <input type="text" value={primary} onChange={(e) => setPrimary(e.target.value)} className="flex-1 text-sm border-gray-300 rounded-md shadow-sm p-2 border uppercase" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Sidebar / Secondary Color</label>
                                <div className="flex space-x-2">
                                    <input type="color" value={secondary} onChange={(e) => setSecondary(e.target.value)} className="h-9 w-12 rounded cursor-pointer" />
                                    <input type="text" value={secondary} onChange={(e) => setSecondary(e.target.value)} className="flex-1 text-sm border-gray-300 rounded-md shadow-sm p-2 border uppercase" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Custom Subdomain</label>
                                <div className="flex items-center">
                                    <input type="text" placeholder="company" className="w-full text-sm border-gray-300 rounded-l-md shadow-sm p-2 border focus:ring-indigo-500 focus:border-indigo-500" />
                                    <span className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md text-sm text-gray-500">.trustcrm.com</span>
                                </div>
                            </div>
                        </div>
                        <button className="w-full mt-6 bg-slate-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors">
                            Save & Apply to Tenant
                        </button>
                    </div>
                </div>

                {/* Live Preview Pane */}
                <div className="lg:col-span-2">
                    <div className="bg-gray-200 p-4 rounded-xl border border-gray-300 shadow-inner h-full flex flex-col">
                        <div className="mb-3 flex items-center text-sm text-gray-500 font-medium">
                            <Globe className="w-4 h-4 mr-2" /> Live Tenant Preview
                        </div>

                        <div className="flex-1 bg-white rounded-lg shadow-md overflow-hidden flex border border-gray-300">
                            {/* Preview Sidebar */}
                            <div className="w-48 h-full flex flex-col p-4 transition-colors duration-300" style={{ backgroundColor: secondary }}>
                                <div className="text-white font-bold text-lg mb-8 truncate">{tenantName}</div>
                                <div className="space-y-3 opacity-60">
                                    <div className="h-3 w-3/4 bg-white rounded"></div>
                                    <div className="h-3 w-1/2 bg-white rounded"></div>
                                    <div className="h-3 w-2/3 bg-white rounded"></div>
                                </div>
                            </div>
                            {/* Preview Content */}
                            <div className="flex-1 p-6 bg-gray-50 flex flex-col">
                                <div className="h-8 w-1/3 bg-gray-200 rounded mb-6"></div>
                                <div className="flex-1 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center flex-col">
                                    <button className="px-6 py-2 rounded-md text-white font-medium shadow transition-colors duration-300" style={{ backgroundColor: primary }}>Brand Accent Button</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
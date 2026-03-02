import React, { useState, useEffect } from 'react';
import { leadAPI } from '../services/api';
import { useBranding } from '../context/BrandingContext';
import { Plus, Search, Filter, MoreVertical, CheckCircle, XCircle } from 'lucide-react';

const LeadsPage = () => {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const { branding } = useBranding();

    const fetchLeads = async () => {
        try {
            const response = await leadAPI.getLeads();
            setLeads(response.data.data);
        } catch (error) {
            console.error('Failed to fetch leads', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeads();
    }, []);

    const updateStatus = async (id, status) => {
        try {
            await leadAPI.updateStatus(id, status);
            fetchLeads();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to update status');
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Lead Management</h1>
                    <p className="text-sm text-gray-500">Track and convert your project inquiries</p>
                </div>
                <button
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium shadow-sm transition-all hover:opacity-90"
                    style={{ backgroundColor: branding.primaryColor }}
                >
                    <Plus size={18} />
                    <span>Add New Lead</span>
                </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-50 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search leads by name, email or phone..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg">
                            <Filter size={16} />
                            <span>Filters</span>
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 text-[11px] font-bold uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Lead Name</th>
                                <th className="px-6 py-4">Contact Info</th>
                                <th className="px-6 py-4">Source</th>
                                <th className="px-6 py-4">Course/Country</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan="6" className="px-6 py-10 text-center text-gray-500">Loading leads...</td></tr>
                            ) : leads.length === 0 ? (
                                <tr><td colSpan="6" className="px-6 py-10 text-center text-gray-500">No leads found.</td></tr>
                            ) : leads.map((lead) => (
                                <tr key={lead._id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-gray-800">{lead.name}</div>
                                        <div className="text-[10px] text-gray-400 mt-1">ID: {lead._id.substring(0, 8)}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        <div>{lead.email}</div>
                                        <div className="text-gray-400">{lead.phone}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-blue-50 text-blue-600">
                                            {lead.source}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        <div className="font-medium">{lead.interestedCourse || 'N/A'}</div>
                                        <div className="text-xs text-gray-400">{lead.interestedCountry || 'N/A'}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${lead.status === 'new' ? 'bg-yellow-100 text-yellow-600' :
                                                lead.status === 'converted' ? 'bg-green-100 text-green-600' :
                                                    lead.status === 'lost' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                                            }`}>
                                            {lead.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => updateStatus(lead._id, 'contacted')}
                                                className="p-1.5 text-blue-500 hover:bg-blue-50 rounded" title="Mark Contacted"
                                            >
                                                <CheckCircle size={16} />
                                            </button>
                                            <button
                                                onClick={() => updateStatus(lead._id, 'converted')}
                                                className="p-1.5 text-green-500 hover:bg-green-50 rounded" title="Convert to Student"
                                            >
                                                <Plus size={16} />
                                            </button>
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
};

export default LeadsPage;

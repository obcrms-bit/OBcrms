import React, { useState, useEffect } from 'react';
import { invoiceAPI } from '../services/api';
import { useBranding } from '../context/BrandingContext';
import { useAuth } from '../context/AuthContext';
import { Receipt, Search, Plus, Send, CheckCircle, FileText, Download } from 'lucide-react';

const InvoicesPage = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const { branding } = useBranding();
    const { user } = useAuth();

    const fetchInvoices = async () => {
        try {
            const response = await invoiceAPI.getInvoices();
            setInvoices(response.data.data);
        } catch (error) {
            console.error('Failed to fetch invoices', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoices();
    }, []);

    const handleSendEmail = async (id) => {
        try {
            setLoading(true);
            await invoiceAPI.sendEmail(id);
            alert('Invoice email sent successfully with PDF attachment');
            fetchInvoices();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to send invoice email');
        } finally {
            setLoading(false);
        }
    };

    const markAsPaid = async (id) => {
        try {
            await invoiceAPI.updateStatus(id, 'paid', 'bank_transfer');
            fetchInvoices();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to update payment status');
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white"
                        style={{ backgroundColor: branding.primaryColor }}
                    >
                        <Receipt size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Billing & Invoices</h1>
                        <p className="text-sm text-gray-500">Manage student payments and academic fees</p>
                    </div>
                </div>
                <button
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium shadow-sm transition-all hover:opacity-90"
                    style={{ backgroundColor: branding.primaryColor }}
                >
                    <Plus size={18} />
                    <span>Generate Invoice</span>
                </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-50 flex items-center justify-between">
                    <div className="flex gap-4 items-center">
                        <span className="text-sm font-bold text-gray-400 uppercase">Recent Invoices</span>
                        <div className="flex gap-1">
                            <button className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-[10px] font-bold">All</button>
                            <button className="px-2 py-1 hover:bg-gray-50 rounded text-[10px] font-bold text-gray-500">Unpaid</button>
                            <button className="px-2 py-1 hover:bg-gray-50 rounded text-[10px] font-bold text-gray-500">Paid</button>
                        </div>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Find invoice #"
                            className="pl-9 pr-4 py-1.5 bg-gray-50 border-none rounded-lg text-xs outline-none"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 text-[11px] font-bold uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Invoice #</th>
                                <th className="px-6 py-4">Student</th>
                                <th className="px-6 py-4">Amount</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Due Date</th>
                                <th className="px-6 py-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading && !invoices.length ? (
                                <tr><td colSpan="6" className="px-6 py-10 text-center text-gray-500">Processing invoices...</td></tr>
                            ) : invoices.length === 0 ? (
                                <tr><td colSpan="6" className="px-6 py-10 text-center text-gray-500">No invoices yet.</td></tr>
                            ) : invoices.map((inv) => (
                                <tr key={inv._id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-800">{inv.invoiceNumber}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium">{inv.studentId?.fullName || 'N/A'}</div>
                                        <div className="text-[10px] text-gray-400 tracking-wider">REF: {inv.studentId?._id.substring(18, 24)}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-bold text-gray-800">{inv.totalAmount.toLocaleString()} {inv.currency}</div>
                                        <div className="text-[10px] text-gray-400">Incl. Tax</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${inv.status === 'paid' ? 'bg-green-100 text-green-600' :
                                                inv.status === 'sent' ? 'bg-blue-100 text-blue-600' :
                                                    inv.status === 'overdue' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'
                                            }`}>
                                            {inv.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {new Date(inv.dueDate).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleSendEmail(inv._id)}
                                                className="p-1.5 text-blue-500 hover:bg-blue-50 rounded" title="Send Email"
                                            >
                                                <Send size={16} />
                                            </button>
                                            {inv.status !== 'paid' && (
                                                <button
                                                    onClick={() => markAsPaid(inv._id)}
                                                    className="p-1.5 text-green-500 hover:bg-green-50 rounded" title="Mark as Paid"
                                                >
                                                    <CheckCircle size={16} />
                                                </button>
                                            )}
                                            <button className="p-1.5 text-gray-400 hover:bg-gray-50 rounded" title="Download PDF">
                                                <Download size={16} />
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

export default InvoicesPage;

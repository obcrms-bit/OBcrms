import React, { useState, useEffect } from 'react';
import { applicantAPI } from '../services/api';
import { useBranding } from '../context/BrandingContext';
import {
  BookMarked,
  Search,
  Filter,
  Mail,
  Plane,
  Plus,
  CheckCircle,
  FileText,
} from 'lucide-react';

const ApplicantsPage = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { branding } = useBranding();

  const fetchApplications = async () => {
    try {
      const response = await applicantAPI.getApplications();
      setApplications(response.data.data);
    } catch (error) {
      console.error('Failed to fetch applications', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await applicantAPI.updateStatus(id, status);
      fetchApplications();
    } catch (error) {
      alert(
        error.response?.data?.message || 'Failed to update application status'
      );
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
            <BookMarked size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              University Applications
            </h1>
            <p className="text-sm text-gray-500">
              Track student applications and visa processes
            </p>
          </div>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium shadow-sm transition-all hover:opacity-90"
          style={{ backgroundColor: branding.primaryColor }}
        >
          <Plus size={18} />
          <span>New Application</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-50 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search by student, university or country..."
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
                <th className="px-6 py-4">Student & University</th>
                <th className="px-6 py-4">Course & Intake</th>
                <th className="px-6 py-4">Fees</th>
                <th className="px-6 py-4">Current Stage</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-10 text-center text-gray-500"
                  >
                    Loading applications...
                  </td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-10 text-center text-gray-500"
                  >
                    No applications found.
                  </td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr
                    key={app._id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-800">
                        {app.studentId?.fullName || 'Unknown Student'}
                      </div>
                      <div className="text-xs text-blue-600 font-medium mt-0.5 uppercase tracking-tighter">
                        {app.universityName} ({app.country})
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium">
                        {app.courseName}
                      </div>
                      <div className="text-[10px] text-gray-400 uppercase mt-1">
                        Intake: {app.intake}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        App Fee: {app.applicationFee?.amount}{' '}
                        {app.applicationFee?.currency}
                      </div>
                      <div className="text-xs text-gray-400">
                        Paid:{' '}
                        {app.applicationFee?.status === 'paid' ? 'Yes' : 'No'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          app.status === 'offer-received'
                            ? 'bg-green-100 text-green-600'
                            : app.status === 'draft'
                              ? 'bg-gray-100 text-gray-600'
                              : 'bg-blue-100 text-blue-600'
                        }`}
                      >
                        {app.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            updateStatus(app._id, 'offer-received')
                          }
                          className="p-1.5 text-green-500 hover:bg-green-50 rounded"
                          title="Mark Offer Received"
                        >
                          <Mail size={16} />
                        </button>
                        <button
                          onClick={() => updateStatus(app._id, 'visa-applied')}
                          className="p-1.5 text-blue-500 hover:bg-blue-50 rounded"
                          title="Mark Visa Applied"
                        >
                          <Plane size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ApplicantsPage;

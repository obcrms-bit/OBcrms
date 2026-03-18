import React, { useState, useEffect } from 'react';
import { studentAPI } from '../services/api';
import { useBranding } from '../context/BrandingContext';
import { useAuth } from '../context/AuthContext';
import {
  GraduationCap,
  Search,
  Filter,
  UserCheck,
  CalendarDays,
  ExternalLink,
  MoreVertical,
} from 'lucide-react';

const StudentsPage = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { branding } = useBranding();
  const { user } = useAuth();

  const fetchStudents = async () => {
    try {
      const response = await studentAPI.getAllStudents(page, 10);
      setStudents(response.data.data.students);
      setTotalPages(response.data.data.totalPages);
    } catch (error) {
      console.error('Failed to fetch students', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [page]);

  const updateStatus = async (id, status) => {
    try {
      await studentAPI.updateStatus(id, status);
      fetchStudents();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update student status');
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
            <GraduationCap size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Student Directory
            </h1>
            <p className="text-sm text-gray-500">
              Manage student profiles, status and counselling
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-50 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Filter by student name, email, phone or country..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <Filter size={16} />
            <span>Advanced Filters</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-[11px] font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Student Name</th>
                <th className="px-6 py-4">Academic Info</th>
                <th className="px-6 py-4">Financials</th>
                <th className="px-6 py-4">Counselor</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-10 text-center text-gray-500"
                  >
                    Loading directory...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-10 text-center text-gray-500"
                  >
                    No students found.
                  </td>
                </tr>
              ) : (
                students.map((std) => (
                  <tr
                    key={std._id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-800">
                        {std.fullName}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {std.email}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {std.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium">
                        {std.educationHistory?.[0]?.qualification || 'N/A'}
                      </div>
                      <div className="text-[10px] text-gray-400 uppercase mt-1">
                        Scores: {std.testScores?.overall || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600">
                        {std.currency || 'USD'} 0.00
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center text-[10px] font-bold text-blue-600">
                          ID
                        </div>
                        <span className="text-xs font-medium text-gray-600">
                          Unassigned
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={std.status}
                        onChange={(e) => updateStatus(std._id, e.target.value)}
                        className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase border-none focus:ring-0 cursor-pointer ${
                          std.status === 'prospect'
                            ? 'bg-blue-100 text-blue-600'
                            : std.status === 'enrolled'
                              ? 'bg-green-100 text-green-600'
                              : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        <option value="prospect">Prospect</option>
                        <option value="counseling">Counseling</option>
                        <option value="application">Application</option>
                        <option value="enrolled">Enrolled</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors"
                          title="View Profile"
                        >
                          <ExternalLink size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-gray-50 flex items-center justify-between text-sm text-gray-500">
          <span>Showing {students.length} students</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 border border-gray-200 rounded disabled:opacity-50"
            >
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 border border-gray-200 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentsPage;

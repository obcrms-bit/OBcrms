import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  BookOpen,
  DollarSign,
  ClipboardList,
  Plus,
  Search,
} from 'lucide-react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import StatsCard from '../components/Dashboard/StatsCard';
import StudentTable from '../components/Dashboard/StudentTable';
import StudentFormModal from '../components/Dashboard/StudentFormModal';
import { LoadingSpinner } from '../components/Common';
import { dashboardAPI, leadAPI } from '../services/api';
import * as studentService from '../services/studentService';

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [summary, setSummary] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentLoading, setStudentLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [error, setError] = useState('');

  const fetchStats = useCallback(async () => {
    try {
      const [statsResponse, summaryResponse] = await Promise.all([
        dashboardAPI.getDashboardStats(),
        leadAPI.getFollowUpSummary(),
      ]);
      setStats(statsResponse.data?.data || null);
      setSummary(summaryResponse.data?.data || null);
    } catch (requestError) {
      console.error('Failed to fetch stats:', requestError);
      setStats(null);
      setSummary(null);
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to load dashboard data.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStudents = useCallback(async () => {
    setStudentLoading(true);
    try {
      const response = await studentService.getStudents(page, 10, search);
      if (response.success) {
        setStudents(response.data.students || response.data);
        setTotalPages(response.data.totalPages || 1);
      } else {
        setStudents([]);
        setTotalPages(1);
      }
    } catch (requestError) {
      console.error('Failed to fetch students:', requestError);
      setStudents([]);
      setTotalPages(1);
    } finally {
      setStudentLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleAddStudent = () => {
    setSelectedStudent(null);
    setModalOpen(true);
  };

  const handleEditStudent = (student) => {
    setSelectedStudent(student);
    setModalOpen(true);
  };

  const handleDeleteStudent = async (id) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        await studentService.deleteStudent(id);
        fetchStudents();
      } catch (requestError) {
        console.error('Failed to delete student:', requestError);
        alert('Failed to delete student');
      }
    }
  };

  const handleSubmitForm = async (formData) => {
    try {
      if (selectedStudent) {
        await studentService.updateStudent(selectedStudent._id, formData);
      } else {
        await studentService.createStudent(formData);
      }
      setModalOpen(false);
      setSelectedStudent(null);
      fetchStudents();
      fetchStats();
    } catch (requestError) {
      console.error('Failed to save student:', requestError);
      alert('Failed to save student');
    }
  };

  const handleSearch = (value) => {
    setSearch(value);
    setPage(1);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner text="Loading dashboard..." />
        </div>
      </DashboardLayout>
    );
  }

  const counts = summary?.counts || {};

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-2">
              Manage students and monitor live CRM workload from real backend data.
            </p>
          </div>
          <button
            onClick={handleAddStudent}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Add Student</span>
          </button>
        </div>

        {error ? (
          <div className="card p-6 border border-red-100 bg-red-50">
            <p className="text-sm font-semibold text-red-700">{error}</p>
          </div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Students"
            value={stats?.totalStudents || 0}
            icon={Users}
            color="primary"
            description="Student records in the tenant"
          />
          <StatsCard
            title="Leads"
            value={stats?.totalLeads || 0}
            icon={ClipboardList}
            color="warning"
            description="Active CRM leads"
          />
          <StatsCard
            title="Applications"
            value={stats?.totalApplications || 0}
            icon={BookOpen}
            color="success"
            description="Applications in workflow"
          />
          <StatsCard
            title="Revenue"
            value={formatCurrency(stats?.revenue || 0)}
            icon={DollarSign}
            color="danger"
            description="Paid invoice revenue"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Students</h2>
                <div className="relative">
                  <Search
                    size={18}
                    className="absolute left-3 top-3 text-gray-400"
                  />
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={search}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="input-field pl-10 w-64"
                  />
                </div>
              </div>

              <StudentTable
                students={students}
                loading={studentLoading}
                onEdit={handleEditStudent}
                onDelete={handleDeleteStudent}
              />

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    Page <span className="font-semibold">{page}</span> of{' '}
                    <span className="font-semibold">{totalPages}</span>
                  </p>
                  <div className="space-x-2">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="btn-secondary disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                      className="btn-secondary disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="card p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button onClick={handleAddStudent} className="w-full btn-primary">
                  Add New Student
                </button>
                <button className="w-full btn-secondary">Open Leads</button>
                <button className="w-full btn-secondary">Review Applications</button>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Follow-up Snapshot
              </h3>
              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex items-center justify-between">
                  <span>Due today</span>
                  <span className="font-semibold">{counts.dueToday || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Overdue</span>
                  <span className="font-semibold">{counts.overdue || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Completed today</span>
                  <span className="font-semibold">{counts.completedToday || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>No future follow-up</span>
                  <span className="font-semibold">
                    {counts.leadsWithoutFutureFollowUp || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <StudentFormModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedStudent(null);
        }}
        onSubmit={handleSubmitForm}
        student={selectedStudent}
      />
    </DashboardLayout>
  );
};

export default AdminDashboard;

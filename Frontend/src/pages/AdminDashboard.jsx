import React, { useState, useEffect } from 'react';
import { Users, BookOpen, CheckCircle, Clock, Plus, Search } from 'lucide-react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import StatsCard from '../components/Dashboard/StatsCard';
import StudentTable from '../components/Dashboard/StudentTable';
import StudentFormModal from '../components/Dashboard/StudentFormModal';
import { LoadingSpinner } from '../components/Common';
import { dashboardAPI } from '../services/api';
import * as studentService from '../services/studentService';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentLoading, setStudentLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Fetch stats
  useEffect(() => {
    fetchStats();
  }, []);

  // Fetch students
  useEffect(() => {
    fetchStudents();
  }, [page, search]);

  const fetchStats = async () => {
    try {
      const response = await dashboardAPI.getDashboardStats();
      setStats(response.data.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    setStudentLoading(true);
    try {
      const response = await studentService.getStudents(page, 10, search);
      if (response.success) {
        setStudents(response.data.students || response.data);
        setTotalPages(response.data.totalPages || 1);
      }
    } catch (error) {
      console.error('Failed to fetch students:', error);
    } finally {
      setStudentLoading(false);
    }
  };

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
      } catch (error) {
        console.error('Failed to delete student:', error);
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
    } catch (error) {
      console.error('Failed to save student:', error);
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

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage students and track performance</p>
          </div>
          <button
            onClick={handleAddStudent}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Add Student</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Students"
            value={stats?.totalStudents || 0}
            icon={Users}
            color="primary"
            trend={12}
            description="Increase from last month"
          />
          <StatsCard
            title="Applications"
            value={stats?.totalApplications || 0}
            icon={BookOpen}
            color="warning"
            trend={8}
            description="New applications"
          />
          <StatsCard
            title="Visa Approved"
            value={stats?.visaApprovedCount || 0}
            icon={CheckCircle}
            color="success"
            trend={15}
            description="Successful approvals"
          />
          <StatsCard
            title="Pending"
            value={stats?.pendingCount || 0}
            icon={Clock}
            color="danger"
            trend={-5}
            description="Awaiting action"
          />
        </div>

        {/* Students Section */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Students Table */}
          <div className="lg:col-span-3">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Students</h2>
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={search}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="input-field pl-10 w-64"
                  />
                </div>
              </div>

              {/* Student Table */}
              <StudentTable
                students={students}
                loading={studentLoading}
                onEdit={handleEditStudent}
                onDelete={handleDeleteStudent}
              />

              {/* Pagination */}
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

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="card p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={handleAddStudent}
                  className="w-full btn-primary"
                >
                  Add New Student
                </button>
                <button className="w-full btn-secondary">View Reports</button>
                <button className="w-full btn-secondary">Manage Counselors</button>
              </div>
            </div>

            {/* Tasks */}
            <div className="card p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">This Week</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                  <p className="text-sm text-gray-700">5 application reviews</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-warning-500 rounded-full"></div>
                  <p className="text-sm text-gray-700">3 counselor meetings</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-success-500 rounded-full"></div>
                  <p className="text-sm text-gray-700">2 visa approvals</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Student Form Modal */}
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

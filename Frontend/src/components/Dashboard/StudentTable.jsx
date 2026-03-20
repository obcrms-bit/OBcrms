import React from 'react';
import { Trash2, Edit2, Eye } from 'lucide-react';

const StudentTable = ({ students, loading, onEdit, onDelete, onView }) => {
  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-primary-500 rounded-full animate-spin"></div>
        </div>
        <p className="text-gray-600 mt-4">Loading students...</p>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-block bg-gray-100 p-6 rounded-full mb-4">
          <Eye size={32} className="text-gray-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No Students Found
        </h3>
        <p className="text-gray-600">Start by adding your first student</p>
      </div>
    );
  }

  const getStatusBadgeColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'new':
        return 'badge-primary';
      case 'processing':
        return 'badge-warning';
      case 'applied':
        return 'badge-warning';
      case 'visa approved':
        return 'badge-success';
      case 'rejected':
        return 'badge-danger';
      default:
        return 'badge-primary';
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
              Email
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
              Course
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
              Phone
            </th>
            <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr
              key={student._id}
              className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <td className="px-6 py-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {student.name}
                  </p>
                </div>
              </td>
              <td className="px-6 py-4">
                <p className="text-sm text-gray-600">{student.email}</p>
              </td>
              <td className="px-6 py-4">
                <p className="text-sm text-gray-600">{student.course || '-'}</p>
              </td>
              <td className="px-6 py-4">
                <span
                  className={`badge ${getStatusBadgeColor(student.status)}`}
                >
                  {student.status || 'No status'}
                </span>
              </td>
              <td className="px-6 py-4">
                <p className="text-sm text-gray-600">{student.phone || '-'}</p>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center justify-center space-x-2">
                  <button
                    onClick={() => onView && onView(student._id)}
                    className="p-2 text-primary-500 hover:bg-primary-50 rounded-lg transition-colors"
                    title="View"
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    onClick={() => onEdit && onEdit(student)}
                    className="p-2 text-primary-500 hover:bg-primary-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => onDelete && onDelete(student._id)}
                    className="p-2 text-danger-500 hover:bg-danger-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StudentTable;

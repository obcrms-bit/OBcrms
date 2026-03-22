import React from 'react';

interface ApplicationTabProps {
  applications?: any[];
}

const ApplicationTab: React.FC<ApplicationTabProps> = ({ applications = [] }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">Applications</h3>
        <button className="px-3 py-2 rounded-lg text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700">Create Application</button>
      </div>
      {applications.length === 0 ? (
        <p className="text-sm text-gray-500">No applications created yet.</p>
      ) : (
        <div className="space-y-3">
          {applications.map((a, idx) => (
            <div key={a._id || idx} className="border border-gray-100 rounded-lg p-3 flex justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-800">{a.institution || 'Institution'}</p>
                <p className="text-xs text-gray-500">{a.course}</p>
              </div>
              <span className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700 font-semibold">{a.status || 'draft'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ApplicationTab;

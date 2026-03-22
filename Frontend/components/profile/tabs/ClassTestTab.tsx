import React from 'react';

interface ClassTestTabProps {
  tests?: any[];
}

const ClassTestTab: React.FC<ClassTestTabProps> = ({ tests = [] }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">Class / Test Scores</h3>
        <button className="px-3 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700">Add Test</button>
      </div>
      {tests.length === 0 ? (
        <p className="text-sm text-gray-500">No test records yet.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {tests.map((t, idx) => (
            <div key={t._id || idx} className="border border-gray-100 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-gray-900">{t.testType}</h4>
                <span className="text-xs font-bold bg-purple-50 text-purple-700 px-2 py-1 rounded">{t.overallScore}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Taken: {new Date(t.testDate).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClassTestTab;

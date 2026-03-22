import React from 'react';

interface FollowUpTabProps {
  followUps?: any[];
}

const FollowUpTab: React.FC<FollowUpTabProps> = ({ followUps = [] }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">Follow-ups</h3>
        <button className="px-3 py-2 rounded-lg text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800">
          Schedule Follow-up
        </button>
      </div>
      {followUps.length === 0 ? (
        <p className="text-sm text-gray-500">No follow-ups recorded for this profile.</p>
      ) : (
        <div className="space-y-3">
          {followUps.map((f, idx) => (
            <div key={f._id || idx} className="border border-gray-100 rounded-lg p-3 flex justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-800">{f.type || 'Follow-up'}</p>
                <p className="text-xs text-gray-500">{new Date(f.scheduledAt).toLocaleString()}</p>
                <p className="text-xs text-gray-500">{f.notes}</p>
              </div>
              <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">{f.status || 'pending'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FollowUpTab;

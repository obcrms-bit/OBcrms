import React from 'react';

interface ActivityLogTabProps {
  logs: any[];
}

const ActivityLogTab: React.FC<ActivityLogTabProps> = ({ logs }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        Activity Logs
      </h3>
      
      {(!logs || logs.length === 0) ? (
        <div className="text-center py-8 text-gray-500">
           No activities found.
        </div>
      ) : (
        <div className="space-y-6">
          {logs.map((log: any, idx: number) => (
             <div key={idx} className="flex gap-4">
               <div className="flex flex-col items-center">
                 <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs shrink-0">
                   {log.type ? log.type[0].toUpperCase() : 'A'}
                 </div>
                 {idx !== logs.length - 1 && <div className="w-0.5 h-full bg-gray-200 mt-2"></div>}
               </div>
               <div className="pb-6">
                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-1 md:gap-4 mb-1">
                   <h4 className="text-sm font-semibold text-gray-900">{log.type || 'Activity'}</h4>
                   <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                     {new Date(log.createdAt).toLocaleString()}
                   </span>
                 </div>
                 <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100 inline-block w-full">{log.message || 'No description provided.'}</p>
                 <span className="text-xs text-gray-400 mt-2 block">
                   By {log.createdBy?.firstName} {log.createdBy?.lastName}
                 </span>
               </div>
             </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActivityLogTab;

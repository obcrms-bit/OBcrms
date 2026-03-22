import React from 'react';

interface DocumentsTabProps {
  documents?: any[];
}

const DocumentsTab: React.FC<DocumentsTabProps> = ({ documents = [] }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">Documents</h3>
        <button className="px-3 py-2 rounded-lg text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800">Upload Document</button>
      </div>
      {documents.length === 0 ? (
        <p className="text-sm text-gray-500">No documents uploaded.</p>
      ) : (
        <div className="space-y-3">
          {documents.map((d, idx) => (
            <div key={d._id || idx} className="border border-gray-100 rounded-lg p-3 flex justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-800">{d.name || 'Document'}</p>
                <p className="text-xs text-gray-500">{d.type}</p>
              </div>
              <span className="text-xs text-gray-500">{new Date(d.createdAt).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentsTab;

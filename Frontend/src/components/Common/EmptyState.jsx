import React from 'react';
import { AlertCircle } from 'lucide-react';

const EmptyState = ({ icon: Icon, title, description, action }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="bg-gray-100 p-6 rounded-full mb-4">
        <Icon size={32} className="text-gray-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm text-center mb-6 max-w-md">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
};

export default EmptyState;

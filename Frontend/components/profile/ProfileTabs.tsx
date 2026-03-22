import React from 'react';

interface ProfileTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const ProfileTabs: React.FC<ProfileTabsProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    'Overview',
    'Follow-up',
    'Course AI',
    'Class / Test',
    'Payment',
    'Documents',
    'Application',
    'Activity Logs',
    'Visits & Calls',
    'Notes'
  ];

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-gray-100 p-1 flex overflow-x-auto no-scrollbar scroll-smooth snap-x">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`shrink-0 px-5 py-2.5 rounded-lg text-sm font-medium transition-all snap-start ${
            activeTab === tab 
              ? 'bg-blue-600 text-white shadow-md' 
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
};

export default ProfileTabs;

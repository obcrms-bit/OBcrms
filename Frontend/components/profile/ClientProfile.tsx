import React, { useState, useEffect } from 'react';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileTabs from '@/components/profile/ProfileTabs';
import OverviewTab from '@/components/profile/tabs/OverviewTab';
import CourseAiTab from '@/components/profile/tabs/CourseAiTab';
import ActivityLogTab from '@/components/profile/tabs/ActivityLogTab';
import VisitsCallsTab from '@/components/profile/tabs/VisitsCallsTab';
import NotesSection from '@/components/profile/tabs/NotesSection';
import { getFullProfile } from '@/lib/api/profile';

interface ClientProfileProps {
  id: string;
  type: 'lead' | 'student';
}

const ClientProfile: React.FC<ClientProfileProps> = ({ id, type }) => {
  const [activeTab, setActiveTab] = useState('Overview');
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        const res = await getFullProfile(id, type);
        if (res.success) {
          setProfileData(res.data);
        }
      } catch (error) {
        console.error('Error fetching profile data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [id, type]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profileData) {
    return <div className="p-8 text-center text-red-500">Profile data not found.</div>;
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Overview':
        return <OverviewTab data={profileData} />;
      case 'Course AI':
        return <CourseAiTab clientId={id} clientType={type} profileData={profileData} />;
      case 'Activity Logs':
        return <ActivityLogTab logs={profileData.activityLogs} />;
      case 'Visits & Calls':
        return <VisitsCallsTab visits={profileData.officeVisits} calls={profileData.callLogs} clientId={id} clientType={type} />;
      case 'Notes':
        return <NotesSection notes={profileData.notes} clientId={id} clientType={type} />;
      default:
        return <div className="p-8 text-gray-500 text-center bg-white rounded-lg shadow-sm border border-gray-100">Module coming soon...</div>;
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 space-y-6">
      <ProfileHeader profile={profileData.profile} type={type} />
      
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-64 shrink-0 flex flex-col gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
             <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick Actions</h3>
             <div className="flex flex-col gap-2">
               <button className="flex items-center gap-2 text-sm text-gray-700 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Add Follow Up
               </button>
               <button className="flex items-center gap-2 text-sm text-gray-700 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  Send Email
               </button>
               <button className="flex items-center gap-2 text-sm text-gray-700 hover:text-green-600 hover:bg-green-50 p-2 rounded-lg transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                  Send WhatsApp
               </button>
               <button className="flex items-center gap-2 text-sm text-gray-700 hover:text-purple-600 hover:bg-purple-50 p-2 rounded-lg transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  Schedule Visit/Call
               </button>
               <button className="flex items-center gap-2 text-sm text-gray-700 hover:text-yellow-600 hover:bg-yellow-50 p-2 rounded-lg transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  Add Note
               </button>
             </div>
          </div>
          
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex-1">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Enrolled Status</h3>
            <select className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
               <option>Not Enrolled</option>
               <option>Application Started</option>
               <option>Offer Received</option>
               <option>Visa Approved</option>
               <option>Enrolled</option>
            </select>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <ProfileTabs activeTab={activeTab} setActiveTab={setActiveTab} />
          
          <div className="mt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientProfile;

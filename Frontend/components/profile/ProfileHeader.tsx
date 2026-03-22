import React, { useState } from 'react';
import { addProfileNote } from '@/lib/api/profile';

interface ProfileHeaderProps {
  profile: any;
  type: 'lead' | 'student';
  clientId: string;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ profile, type, clientId }) => {
  const [quickNote, setQuickNote] = useState('');
  const [saving, setSaving] = useState(false);

  const getInitials = (name: string) => {
    if (!name) return 'UN';
    const parts = name.split(' ');
    if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].substring(0, 2).toUpperCase();
  };

  const handleQuickNote = async () => {
    if (!quickNote.trim()) return;
    try {
      setSaving(true);
      await addProfileNote(clientId, type, quickNote.trim(), true);
      setQuickNote('');
    } catch (err) {
      console.error('Quick note failed', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
      {/* Background Decorator */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/3"></div>
      
      <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
        {/* Avatar */}
        <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur border-4 border-white/30 flex items-center justify-center text-3xl font-bold shadow-inner shrink-0 text-white">
          {getInitials(`${profile.firstName} ${profile.lastName}`)}
        </div>

        {/* Info */}
        <div className="flex-1 flex flex-col justify-center text-center md:text-left gap-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{profile.firstName} {profile.lastName}</h1>
            <span className={`px-3 py-1 text-xs font-semibold rounded-full uppercase tracking-wider ${
              type === 'student' ? 'bg-green-500/20 text-green-200 border border-green-400/30' : 'bg-blue-500/20 text-blue-200 border border-blue-400/30'
            }`}>
              {type}
            </span>
          </div>

          <div className="flex flex-wrap gap-4 text-indigo-200 text-sm mt-1">
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              {profile.email || 'No email provided'}
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
              {profile.phone || 'No phone provided'}
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              {profile.country || 'Location unknown'}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 shrink-0">
          <div className="flex items-center bg-white/10 rounded-lg p-1 w-full max-w-[280px]">
            <input 
              type="text" 
              placeholder="Add a quick note..." 
              value={quickNote}
              onChange={(e) => setQuickNote(e.target.value)}
              className="bg-transparent border-none text-white placeholder-indigo-300 focus:outline-none focus:ring-0 px-3 py-1 w-full text-sm"
            />
            <button
              onClick={handleQuickNote}
              disabled={saving}
              className="bg-indigo-500 hover:bg-indigo-400 text-white rounded p-1.5 transition-colors disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </button>
          </div>
          <div className="flex gap-2 justify-end w-full">
            <button className="bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg px-4 py-2 text-sm font-medium transition-all flex items-center gap-2 backdrop-blur">
              Print
            </button>
            <button className="bg-green-500 hover:bg-green-400 text-white rounded-lg px-4 py-2 text-sm font-medium transition-all shadow-md flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
              Follow Up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;

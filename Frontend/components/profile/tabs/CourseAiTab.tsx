import React, { useState, useEffect, useMemo } from 'react';
import { generateCourseRecommendations, getCourseRecommendations, toggleCourseShortlist } from '@/lib/api/profile';
import { useAuth } from '@/context/AuthContext';

interface CourseAiTabProps {
  clientId: string;
  clientType: 'lead' | 'student';
  profileData: any;
}

const CourseAiTab: React.FC<CourseAiTabProps> = ({ clientId, clientType, profileData }) => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<any[]>(profileData.courseRecommendations || []);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [countryFilter, setCountryFilter] = useState<string>('All');
  const [levelFilter, setLevelFilter] = useState<string>('All');
  const [fieldFilter, setFieldFilter] = useState<string>('All');
  const [intakeFilter, setIntakeFilter] = useState<string>('All');
  const [eligibleOnly, setEligibleOnly] = useState(false);

  const canGenerate = ['TENANT_ADMIN', 'BRANCH_ADMIN', 'COUNSELLOR'].includes(user?.role);

  const handleGenerate = async () => {
    try {
      setLoading(true);
      const res = await generateCourseRecommendations(clientId, clientType);
      if (res.success) {
        setRecommendations(res.data);
      }
    } catch (error) {
      console.error('Error generating AI matches', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleShortlist = async (id: string, currentStatus: boolean) => {
    try {
       const res = await toggleCourseShortlist(id, !currentStatus);
       if (res.success) {
          setRecommendations(prev => prev.map(r => r._id === id ? { ...r, isShortlisted: !currentStatus } : r));
       }
    } catch (err) {
      console.error('Error toggling shortlist', err);
    }
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'Best Match': return 'bg-green-100 text-green-800 border-green-200';
      case 'Safe Match': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Moderate Match': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Aspirational Match': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  useEffect(() => {
    const fetch = async () => {
      if (profileData.courseRecommendations?.length) return;
      try {
        const res = await getCourseRecommendations(clientId, clientType);
        if (res.success) setRecommendations(res.data);
      } catch (error) {
        console.error('Failed to fetch recommendations', error);
      }
    };
    fetch();
  }, [clientId, clientType, profileData.courseRecommendations]);

  const filteredRecs = useMemo(
    () =>
      recommendations.filter((r) => {
        if (activeFilter === 'Shortlisted' && !r.isShortlisted) return false;
        if (eligibleOnly && r.eligibilityStatus !== 'Eligible') return false;
        if (countryFilter !== 'All' && r.courseId?.country !== countryFilter) return false;
        if (levelFilter !== 'All' && r.courseId?.level !== levelFilter) return false;
        if (fieldFilter !== 'All' && r.courseId?.field !== fieldFilter) return false;
        if (intakeFilter !== 'All' && !(r.courseId?.intake || []).includes(intakeFilter)) return false;
        return true;
      }),
    [recommendations, activeFilter, eligibleOnly, countryFilter, levelFilter, fieldFilter, intakeFilter]
  );

  const countries = Array.from(new Set(recommendations.map((r) => r.courseId?.country).filter(Boolean)));
  const levels = Array.from(new Set(recommendations.map((r) => r.courseId?.level).filter(Boolean)));
  const fields = Array.from(new Set(recommendations.map((r) => r.courseId?.field).filter(Boolean)));
  const intakes = Array.from(
    new Set(
      recommendations
        .flatMap((r) => r.courseId?.intake || [])
        .filter(Boolean)
    )
  );

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-2xl border border-blue-100 shadow-inner">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
            Course AI Recommendations
          </h2>
          <p className="text-sm text-gray-600 mt-1 max-w-2xl">
            AI-powered course matching based on academic profile, test scores, career interests, and eligibility rules.
          </p>
        </div>
        <button 
          onClick={handleGenerate}
          disabled={loading || !canGenerate}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg font-medium shadow-md transition-all flex items-center gap-2"
          title={canGenerate ? '' : 'You do not have permission to run Course AI'}
        >
          {loading ? (
            <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
          ) : (
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          )}
          {loading ? 'Analyzing Profile...' : 'Run AI Match'}
        </button>
      </div>

      {/* Snapshot + warnings */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Academic Snapshot</h4>
          <p className="text-sm text-gray-600">Level: <span className="font-semibold">{profileData.academicProfile?.qualificationLevel || 'N/A'}</span></p>
          <p className="text-sm text-gray-600">Score: <span className="font-semibold">{profileData.academicProfile?.academicScore || 'N/A'}</span> {profileData.academicProfile?.gradingType}</p>
          <p className="text-sm text-gray-600">Gap/Backlogs: {profileData.academicProfile?.studyGap || 0} yrs / {profileData.academicProfile?.backlogCount || 0}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Tests</h4>
          {profileData.testScores?.length ? (
            <div className="flex flex-wrap gap-2">
              {profileData.testScores.map((t: any) => (
                <span key={t._id || t.testType} className="px-2 py-1 rounded-full text-xs bg-purple-50 text-purple-700 border border-purple-100">
                  {t.testType}: {t.overallScore}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No tests recorded.</p>
          )}
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Career Intent</h4>
          <p className="text-sm text-gray-600">Level: {profileData.careerInterest?.desiredLevel || 'N/A'}</p>
          <p className="text-sm text-gray-600">Countries: {(profileData.careerInterest?.preferredCountries || []).join(', ') || 'N/A'}</p>
          <p className="text-sm text-gray-600">Programs: {(profileData.careerInterest?.targetPrograms || []).join(', ') || 'N/A'}</p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-3 text-sm">
        {profileData.testScores?.length ? 'Recommendations consider language cut-offs and eligibility rules.' : 'Warning: No test scores found; recommendations may be downgraded.'}
      </div>

      {/* Filters */}
      <div className="flex gap-2 border-b border-gray-200 pb-2 overflow-x-auto no-scrollbar">
        {['All', 'Shortlisted', 'Eligible Only'].map(filter => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeFilter === filter ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>
      <div className="grid md:grid-cols-4 gap-3">
        <select className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm" value={countryFilter} onChange={(e) => setCountryFilter(e.target.value)}>
          <option value="All">All Countries</option>
          {countries.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm" value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)}>
          <option value="All">All Levels</option>
          {levels.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
        <select className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm" value={fieldFilter} onChange={(e) => setFieldFilter(e.target.value)}>
          <option value="All">All Fields</option>
          {fields.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
        <select className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm" value={intakeFilter} onChange={(e) => setIntakeFilter(e.target.value)}>
          <option value="All">All Intakes</option>
          {intakes.map((i) => <option key={i} value={i}>{i}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={eligibleOnly} onChange={(e) => setEligibleOnly(e.target.checked)} className="rounded text-blue-600" />
          Eligible only
        </label>
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 gap-4">
        {filteredRecs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
             <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
             <p className="text-gray-500 font-medium">No recommendations found.</p>
             <p className="text-sm text-gray-400 mt-1">Run the AI match engine or update profile data.</p>
          </div>
        ) : (
          filteredRecs.map((rec) => (
            <div key={rec._id} className={`bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row gap-5 ${rec.isShortlisted ? 'border-indigo-300 ring-1 ring-indigo-50' : 'border-gray-200'}`}>
              <div className="flex-1">
                 <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{rec.courseId?.courseName || 'Unknown Course'}</h3>
                      <p className="text-gray-500 text-sm">{rec.courseId?.institutionName} / {rec.courseId?.country}</p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getBadgeColor(rec.recommendationType)}`}>
                      {rec.recommendationType}
                    </span>
                 </div>
                 
                 <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                      {rec.courseId?.level}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {rec.courseId?.duration}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {rec.courseId?.tuition && `${rec.courseId.tuitionCurrency} ${rec.courseId.tuition.toLocaleString()}/yr`}
                    </span>
                 </div>

                 <div className="mt-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <div className="flex items-start gap-2 text-sm text-gray-700">
                       <svg className="w-4 h-4 mt-0.5 text-indigo-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                       <p><span className="font-semibold text-gray-900">AI Reasoning: </span> {rec.explanation}</p>
                    </div>
                 </div>
              </div>

              <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-5 w-full md:w-48 shrink-0">
                 <div className="flex flex-col items-center mb-0 md:mb-4">
                    <span className="text-3xl font-black text-indigo-600">{rec.matchScore}%</span>
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Match Score</span>
                 </div>
                 
                 <div className="flex flex-col w-full gap-2">
                    <button 
                      onClick={() => handleToggleShortlist(rec._id, rec.isShortlisted)}
                      className={`w-full py-2 px-3 rounded-lg text-sm font-medium transition-colors flex justify-center items-center gap-2 ${
                        rec.isShortlisted 
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100' 
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <svg className={`w-4 h-4 ${rec.isShortlisted ? 'fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                      {rec.isShortlisted ? 'Shortlisted' : 'Shortlist'}
                    </button>
                    {rec.isShortlisted && (
                       <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors shadow-sm">
                         Start Application
                       </button>
                    )}
                 </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CourseAiTab;

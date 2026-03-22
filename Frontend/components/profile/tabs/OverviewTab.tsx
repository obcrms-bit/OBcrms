import React from 'react';

interface OverviewTabProps {
  data: any;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ data }) => {
  const { profile, academicProfile, testScores, careerInterest } = data;

  const renderCard = (title: string, value: string | React.ReactNode, subtitle?: string) => (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-1 hover:shadow-md transition-shadow">
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">{title}</span>
      <span className="text-lg font-bold text-gray-900">{value || 'N/A'}</span>
      {subtitle && <span className="text-xs text-gray-400 mt-1">{subtitle}</span>}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {renderCard("Country Interest", careerInterest?.preferredCountries?.join(', '), "Target study destination")}
        {renderCard("Assignee", profile?.assignedTo?.firstName || 'Unassigned', "Primary handling staff")}
        {renderCard("Branch", profile?.branchId?.name || 'Main Branch', "Registered office")}
        {renderCard("Source", profile?.source || 'Organic', "Lead acquisition source")}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-5 py-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              Academic Summary
            </h3>
            <button className="text-blue-600 text-sm hover:underline">Edit</button>
          </div>
          <div className="p-5 space-y-4">
            {academicProfile ? (
              <>
                <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                  <span className="text-gray-500 text-sm">Level</span>
                  <span className="font-medium text-gray-900">{academicProfile.qualificationLevel}</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                  <span className="text-gray-500 text-sm">Institution</span>
                  <span className="font-medium text-sm text-gray-900 line-clamp-1 max-w-[200px] text-right" title={academicProfile.institutionName}>{academicProfile.institutionName}</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                  <span className="text-gray-500 text-sm">Score</span>
                  <span className="font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded text-sm">{academicProfile.academicScore} {academicProfile.gradingType}</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                  <span className="text-gray-500 text-sm">Gap / Backlogs</span>
                  <span className="font-medium text-gray-900 text-sm">{academicProfile.studyGap} yrs gap / {academicProfile.backlogCount} backlogs</span>
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No academic data added yet.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-5 py-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
              Test Scores
            </h3>
            <button className="text-blue-600 text-sm hover:underline">Add</button>
          </div>
          <div className="p-5 space-y-3">
            {testScores && testScores.length > 0 ? (
              testScores.map((ts: any, idx: number) => (
                <div key={idx} className="bg-purple-50 rounded-lg p-3 border border-purple-100 flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="font-bold text-purple-900">{ts.testType}</span>
                    <span className="text-xs text-purple-600">Taken: {new Date(ts.testDate).toLocaleDateString()}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-black text-purple-700">{ts.overallScore}</div>
                    <span className="text-xs text-purple-500 uppercase font-semibold tracking-wide">Overall</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No test scores recorded.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default OverviewTab;

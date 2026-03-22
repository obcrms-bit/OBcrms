import React, { useState } from 'react';
import { addCallLog, addOfficeVisit } from '@/lib/api/profile';

interface VisitsCallsTabProps {
  visits: any[];
  calls: any[];
  clientId: string;
  clientType: 'lead' | 'student';
}

const VisitsCallsTab: React.FC<VisitsCallsTabProps> = ({ visits, calls, clientId, clientType }) => {
  const [activeSubTab, setActiveSubTab] = useState<'Visits' | 'Calls'>('Visits');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [visitForm, setVisitForm] = useState({
    visitDate: '',
    branch: '',
    visitOutcome: '',
    notes: '',
    nextAction: '',
  });

  const [callForm, setCallForm] = useState({
    type: 'Incoming',
    callDate: '',
    duration: '',
    outcome: '',
    notes: '',
    followUpLinked: false,
  });

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      if (activeSubTab === 'Visits') {
        await addOfficeVisit(clientId, clientType, {
          ...visitForm,
          visitDate: visitForm.visitDate ? new Date(visitForm.visitDate) : new Date(),
        });
        setVisitForm({ visitDate: '', branch: '', visitOutcome: '', notes: '', nextAction: '' });
      } else {
        await addCallLog(clientId, clientType, {
          ...callForm,
          callDate: callForm.callDate ? new Date(callForm.callDate) : new Date(),
        });
        setCallForm({ type: 'Incoming', callDate: '', duration: '', outcome: '', notes: '', followUpLinked: false });
      }
      setShowForm(false);
    } catch (error) {
      console.error('Error logging interaction', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
      <div className="flex border-b border-gray-100 bg-gray-50/50">
        <button
          className={`flex-1 py-4 text-center font-medium text-sm transition-colors border-b-2 ${
            activeSubTab === 'Visits' ? 'border-blue-600 text-blue-700 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveSubTab('Visits')}
        >
          Office Visits ({visits?.length || 0})
        </button>
        <button
          className={`flex-1 py-4 text-center font-medium text-sm transition-colors border-b-2 ${
            activeSubTab === 'Calls' ? 'border-green-600 text-green-700 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveSubTab('Calls')}
        >
          Call Logs ({calls?.length || 0})
        </button>
      </div>

      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-gray-900">
            {activeSubTab === 'Visits' ? 'Office Visit History' : 'Call History'}
          </h3>
          <button 
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Log {activeSubTab === 'Visits' ? 'Visit' : 'Call'}
          </button>
        </div>

        {showForm && (
          <div className="mb-6 rounded-lg border border-gray-100 bg-gray-50 p-4 space-y-4">
            {activeSubTab === 'Visits' ? (
              <div className="grid md:grid-cols-2 gap-4">
                <label className="text-sm text-gray-700">
                  Visit Date
                  <input
                    type="datetime-local"
                    value={visitForm.visitDate}
                    onChange={(e) => setVisitForm({ ...visitForm, visitDate: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-sm"
                  />
                </label>
                <label className="text-sm text-gray-700">
                  Branch
                  <input
                    type="text"
                    value={visitForm.branch}
                    onChange={(e) => setVisitForm({ ...visitForm, branch: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-sm"
                    placeholder="e.g., Main Branch"
                  />
                </label>
                <label className="text-sm text-gray-700">
                  Outcome
                  <input
                    type="text"
                    value={visitForm.visitOutcome}
                    onChange={(e) => setVisitForm({ ...visitForm, visitOutcome: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-sm"
                    placeholder="Counselled / Pending Docs / Closed"
                  />
                </label>
                <label className="text-sm text-gray-700">
                  Next Action
                  <input
                    type="text"
                    value={visitForm.nextAction}
                    onChange={(e) => setVisitForm({ ...visitForm, nextAction: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-sm"
                    placeholder="Schedule IELTS, collect docs..."
                  />
                </label>
                <label className="md:col-span-2 text-sm text-gray-700">
                  Notes
                  <textarea
                    value={visitForm.notes}
                    onChange={(e) => setVisitForm({ ...visitForm, notes: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-sm"
                    rows={3}
                    placeholder="Key discussion points"
                  />
                </label>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                <label className="text-sm text-gray-700">
                  Call Date
                  <input
                    type="datetime-local"
                    value={callForm.callDate}
                    onChange={(e) => setCallForm({ ...callForm, callDate: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-sm"
                  />
                </label>
                <label className="text-sm text-gray-700">
                  Type
                  <select
                    value={callForm.type}
                    onChange={(e) => setCallForm({ ...callForm, type: e.target.value as 'Incoming' | 'Outgoing' })}
                    className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-sm"
                  >
                    <option>Incoming</option>
                    <option>Outgoing</option>
                  </select>
                </label>
                <label className="text-sm text-gray-700">
                  Duration
                  <input
                    type="text"
                    value={callForm.duration}
                    onChange={(e) => setCallForm({ ...callForm, duration: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-sm"
                    placeholder="e.g., 10 mins"
                  />
                </label>
                <label className="text-sm text-gray-700">
                  Outcome
                  <input
                    type="text"
                    value={callForm.outcome}
                    onChange={(e) => setCallForm({ ...callForm, outcome: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-sm"
                    placeholder="Interested / Callback / No answer"
                  />
                </label>
                <label className="md:col-span-2 text-sm text-gray-700">
                  Notes
                  <textarea
                    value={callForm.notes}
                    onChange={(e) => setCallForm({ ...callForm, notes: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-sm"
                    rows={3}
                  />
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={callForm.followUpLinked}
                    onChange={(e) => setCallForm({ ...callForm, followUpLinked: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  Link to follow-up
                </label>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-lg text-sm font-semibold border border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {activeSubTab === 'Visits' ? (
          visits && visits.length > 0 ? (
            <div className="space-y-4">
              {visits.map((visit: any, i: number) => (
                <div key={i} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-bold text-blue-900 block">{new Date(visit.visitDate).toLocaleString()}</span>
                      <span className="text-sm font-semibold text-gray-700">Outcome: {visit.visitOutcome}</span>
                    </div>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      By {visit.handledBy?.firstName}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded border border-gray-100 mt-2">{visit.notes || 'No notes left.'}</p>
                </div>
              ))}
            </div>
          ) : (
             <p className="text-gray-500 text-center py-8">No visits recorded.</p>
          )
        ) : (
          calls && calls.length > 0 ? (
            <div className="space-y-4">
              {calls.map((call: any, i: number) => (
                <div key={i} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${call.type === 'Incoming' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-blue-100 text-blue-700 border border-blue-200'}`}>
                        {call.type}
                      </span>
                      <span className="font-bold text-gray-900">{new Date(call.callDate).toLocaleString()}</span>
                    </div>
                    <span className="text-xs text-gray-500 font-semibold">{call.duration}</span>
                  </div>
                  <div className="text-sm font-semibold text-gray-800 mb-2">Outcome: <span className="font-normal text-gray-600">{call.outcome}</span></div>
                  <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded border border-gray-100">{call.notes || 'No notes.'}</p>
                  <p className="text-xs text-gray-400 mt-2 text-right">Handled by {call.handledBy?.firstName}</p>
                </div>
              ))}
            </div>
          ) : (
             <p className="text-gray-500 text-center py-8">No calls recorded.</p>
          )
        )}
      </div>
    </div>
  );
};

export default VisitsCallsTab;

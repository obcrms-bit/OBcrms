import React, { useState } from 'react';
import { addProfileNote } from '@/lib/api/profile';

interface NotesSectionProps {
  notes: any[];
  clientId: string;
  clientType: 'lead' | 'student';
}

const NotesSection: React.FC<NotesSectionProps> = ({ notes, clientId, clientType }) => {
  const [content, setContent] = useState('');
  const [isInternal, setIsInternal] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      setSubmitting(true);
      await addProfileNote(clientId, clientType, content, isInternal);
      setContent('');
      // Ideally trigger a re-fetch of profile data here, but omitted for simplicity.
    } catch (err) {
      console.error('Failed to post note', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Note Input */}
      <div className="w-full md:w-1/3 shrink-0">
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm sticky top-4">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 mb-0.5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            Add New Note
          </h3>
          <form onSubmit={handleSubmit}>
             <textarea 
               value={content}
               onChange={(e) => setContent(e.target.value)}
               placeholder="Write a note or comment..." 
               rows={4}
               className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none transition-all placeholder-gray-400"
               required
             ></textarea>
             
             <div className="flex items-center justify-between mt-4">
               <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-gray-900 transition-colors">
                 <input 
                   type="checkbox" 
                   checked={isInternal}
                   onChange={(e) => setIsInternal(e.target.checked)}
                   className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                 />
                 Internal Note
               </label>
               <button 
                 type="submit" 
                 disabled={submitting}
                 className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors shadow-sm"
               >
                 {submitting ? 'Posting...' : 'Post Note'}
               </button>
             </div>
          </form>
        </div>
      </div>

      {/* Notes List */}
      <div className="flex-1 space-y-4">
        {notes && notes.length > 0 ? (
           notes.map((note: any, i: number) => (
             <div key={i} className={`rounded-xl p-5 shadow-sm border ${note.isInternal ? 'bg-amber-50/50 border-amber-100' : 'bg-white border-gray-100'}`}>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">
                       {note.author?.firstName ? note.author.firstName[0] : 'U'}
                     </div>
                     <div>
                       <h4 className="font-bold text-gray-900 text-sm leading-tight">{note.author?.firstName} {note.author?.lastName}</h4>
                       <span className="text-xs text-gray-400">{new Date(note.createdAt).toLocaleString()}</span>
                     </div>
                  </div>
                  {note.isInternal && (
                     <span className="text-xs font-bold uppercase tracking-wider bg-amber-200 text-amber-800 px-2 py-0.5 rounded border border-amber-300">
                       Internal
                     </span>
                  )}
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.content}</p>
             </div>
           ))
        ) : (
           <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
             <p className="text-gray-500 font-medium">No notes available.</p>
             <p className="text-sm text-gray-400">Add the first note to keep track of important information.</p>
           </div>
        )}
      </div>
    </div>
  );
};

export default NotesSection;

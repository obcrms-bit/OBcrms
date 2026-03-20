'use client';
/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect, useState } from 'react';
import AppShell from '@/components/app/app-shell';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  StatusPill,
} from '@/components/app/shared';
import { studentAPI } from '@/services/api';

export default function StudentsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadStudents = async (nextPage = page, nextSearch = search) => {
    setLoading(true);
    setError('');

    try {
      const response = await studentAPI.getAllStudents(nextPage, 10, nextSearch);
      const data = response.data?.data || {};
      setStudents(data.students || []);
      setTotalPages(data.totalPages || 1);
      setPage(data.currentPage || nextPage);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to load students.'
      );
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadStudents(1, '');
  }, []);

  const updateStatus = async (studentId, status) => {
    try {
      await studentAPI.updateStatus(studentId, status);
      await loadStudents(page, search);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to update student status.'
      );
    }
  };

  return (
    <AppShell
      title="Students"
      description="Browse student records, refresh status, and keep the production student directory aligned with lead conversions."
      actions={
        <button
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          onClick={() => loadStudents(1, search)}
          type="button"
        >
          Refresh
        </button>
      }
    >
      <div className="space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row">
            <input
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:bg-white"
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  loadStudents(1, search);
                }
              }}
              placeholder="Search by name, email, or phone"
              value={search}
            />
            <button
              className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              onClick={() => loadStudents(1, search)}
              type="button"
            >
              Search
            </button>
          </div>
        </section>

        {loading ? <LoadingState label="Loading student directory..." /> : null}
        {!loading && error ? (
          <ErrorState message={error} onRetry={() => loadStudents(page, search)} />
        ) : null}

        {!loading && !error ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            {students.length === 0 ? (
              <EmptyState
                description="No student matched the current filters. Students created from lead conversion will appear here."
                title="No students found"
              />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[960px] text-left">
                    <thead className="border-b border-slate-200 text-xs uppercase tracking-[0.2em] text-slate-500">
                      <tr>
                        <th className="pb-3">Student</th>
                        <th className="pb-3">Contact</th>
                        <th className="pb-3">Counsellor</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3">Update</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {students.map((student) => (
                        <tr key={student._id}>
                          <td className="py-4">
                            <div className="font-semibold text-slate-900">
                              {student.fullName || `${student.firstName || ''} ${student.lastName || ''}`.trim()}
                            </div>
                            <div className="text-sm text-slate-500">
                              {student.source || 'Lead conversion'}
                            </div>
                          </td>
                          <td className="py-4 text-sm text-slate-600">
                            <div>{student.email || 'No email'}</div>
                            <div>{student.phone || 'No phone'}</div>
                          </td>
                          <td className="py-4 text-sm text-slate-600">
                            {student.assignedCounselor?.name || 'Unassigned'}
                          </td>
                          <td className="py-4">
                            <StatusPill tone={student.status}>{student.status}</StatusPill>
                          </td>
                          <td className="py-4">
                            <select
                              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none"
                              onChange={(event) =>
                                updateStatus(student._id, event.target.value)
                              }
                              value={student.status}
                            >
                              {['prospect', 'counseling', 'document-collection', 'application', 'enrolled', 'withdrawn'].map((status) => (
                                <option key={status} value={status}>
                                  {status}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 flex items-center justify-between gap-4 border-t border-slate-200 pt-5">
                  <p className="text-sm text-slate-500">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <button
                      className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={page <= 1}
                      onClick={() => loadStudents(page - 1, search)}
                      type="button"
                    >
                      Previous
                    </button>
                    <button
                      className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={page >= totalPages}
                      onClick={() => loadStudents(page + 1, search)}
                      type="button"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}

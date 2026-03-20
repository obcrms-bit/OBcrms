'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import AppShell from '@/components/app/app-shell';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  StatusPill,
} from '@/components/app/shared';
import { catalogAPI } from '@/src/services/api';

const inputClassName =
  'w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:bg-white';

const emptyUniversity = {
  name: '',
  country: '',
  city: '',
  website: '',
  intakeMonths: '',
};

const emptyCourse = {
  universityId: '',
  name: '',
  level: '',
  discipline: '',
  feeAmount: '',
  country: '',
  intakeMonths: '',
  englishRequirement: '',
};

export default function CatalogPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [universities, setUniversities] = useState([]);
  const [courses, setCourses] = useState([]);
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [universityForm, setUniversityForm] = useState(emptyUniversity);
  const [courseForm, setCourseForm] = useState(emptyCourse);
  const [importPayload, setImportPayload] = useState('[]');
  const [importModule, setImportModule] = useState('universities');
  const [preview, setPreview] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [universitiesResponse, coursesResponse, logsResponse] = await Promise.all([
        catalogAPI.getUniversities(search ? { search } : {}),
        catalogAPI.getCourses(search ? { search } : {}),
        catalogAPI.getImportLogs(),
      ]);
      setUniversities(universitiesResponse.data?.data?.universities || []);
      setCourses(coursesResponse.data?.data?.courses || []);
      setLogs(logsResponse.data?.data?.logs || []);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to load catalog workspace.'
      );
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateUniversity = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await catalogAPI.createUniversity({
        ...universityForm,
        intakeMonths: universityForm.intakeMonths
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
      });
      setUniversityForm(emptyUniversity);
      await loadData();
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to save university.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCreateCourse = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await catalogAPI.createCourse({
        ...courseForm,
        feeAmount: Number(courseForm.feeAmount || 0),
        intakeMonths: courseForm.intakeMonths
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
      });
      setCourseForm(emptyCourse);
      await loadData();
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to save course.'
      );
    } finally {
      setSaving(false);
    }
  };

  const parsedImportRows = useMemo(() => {
    try {
      const rows = JSON.parse(importPayload);
      return Array.isArray(rows) ? rows : [];
    } catch (error) {
      return null;
    }
  }, [importPayload]);

  const handlePreviewImport = async () => {
    if (!parsedImportRows) {
      setError('Bulk import JSON is invalid. Please provide a valid array payload.');
      return;
    }
    const response = await catalogAPI.previewImport({
      module: importModule,
      fileName: `${importModule}-preview.json`,
      rows: parsedImportRows,
    });
    setPreview(response.data?.data?.preview || null);
  };

  const handleExecuteImport = async () => {
    if (!parsedImportRows) {
      setError('Bulk import JSON is invalid. Please provide a valid array payload.');
      return;
    }
    await catalogAPI.executeImport({
      module: importModule,
      fileName: `${importModule}-import.json`,
      rows: parsedImportRows,
    });
    setPreview(null);
    await loadData();
  };

  return (
    <AppShell
      title="Catalog"
      description="Tenant-owned university and course knowledge base with search, manual entry, and bulk import logging."
    >
      {loading ? <LoadingState label="Loading catalog..." /> : null}

      {!loading ? (
        <div className="space-y-8">
          {error ? <ErrorState message={error} onRetry={loadData} /> : null}

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Search Catalog
                </p>
                <h3 className="mt-2 text-xl font-semibold text-slate-900">
                  Counselling search workspace
                </h3>
              </div>
              <div className="flex gap-3">
                <input
                  className={inputClassName}
                  placeholder="Search country, university, course, discipline..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
                <button
                  type="button"
                  onClick={loadData}
                  className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Search
                </button>
              </div>
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-slate-900">Add University</h3>
              <form className="mt-6 space-y-4" onSubmit={handleCreateUniversity}>
                {[
                  ['name', 'University name'],
                  ['country', 'Country'],
                  ['city', 'City'],
                  ['website', 'Website'],
                  ['intakeMonths', 'Intakes (comma separated)'],
                ].map(([field, label]) => (
                  <label key={field} className="block space-y-2">
                    <span className="text-sm font-semibold text-slate-700">{label}</span>
                    <input
                      className={inputClassName}
                      value={universityForm[field]}
                      onChange={(event) =>
                        setUniversityForm((current) => ({
                          ...current,
                          [field]: event.target.value,
                        }))
                      }
                    />
                  </label>
                ))}
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Save University'}
                </button>
              </form>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-slate-900">Add Course</h3>
              <form className="mt-6 space-y-4" onSubmit={handleCreateCourse}>
                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-slate-700">University</span>
                  <select
                    className={inputClassName}
                    value={courseForm.universityId}
                    onChange={(event) =>
                      setCourseForm((current) => ({
                        ...current,
                        universityId: event.target.value,
                      }))
                    }
                  >
                    <option value="">Select a university</option>
                    {universities.map((university) => (
                      <option key={university._id} value={university._id}>
                        {university.name}
                      </option>
                    ))}
                  </select>
                </label>
                {[
                  ['name', 'Course name'],
                  ['level', 'Level'],
                  ['discipline', 'Discipline'],
                  ['feeAmount', 'Fee amount'],
                  ['country', 'Country'],
                  ['intakeMonths', 'Intakes (comma separated)'],
                  ['englishRequirement', 'English requirement'],
                ].map(([field, label]) => (
                  <label key={field} className="block space-y-2">
                    <span className="text-sm font-semibold text-slate-700">{label}</span>
                    <input
                      className={inputClassName}
                      value={courseForm[field]}
                      onChange={(event) =>
                        setCourseForm((current) => ({
                          ...current,
                          [field]: event.target.value,
                        }))
                      }
                    />
                  </label>
                ))}
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Save Course'}
                </button>
              </form>
            </section>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-slate-900">Universities</h3>
              <div className="mt-6 space-y-3">
                {universities.length ? (
                  universities.map((university) => (
                    <div key={university._id} className="rounded-2xl border border-slate-200 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">{university.name}</p>
                          <p className="mt-1 text-sm text-slate-500">
                            {[university.city, university.country].filter(Boolean).join(', ')}
                          </p>
                        </div>
                        <StatusPill tone={university.isActive ? 'completed' : 'lost'}>
                          {university.isActive ? 'Active' : 'Inactive'}
                        </StatusPill>
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState
                    title="No universities yet"
                    description="Add universities manually or use bulk import to build the counselling catalog."
                  />
                )}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-slate-900">Courses</h3>
              <div className="mt-6 space-y-3">
                {courses.length ? (
                  courses.map((course) => (
                    <div key={course._id} className="rounded-2xl border border-slate-200 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">{course.name}</p>
                          <p className="mt-1 text-sm text-slate-500">
                            {course.universityId?.name} / {course.level || 'Level not set'}
                          </p>
                        </div>
                        <StatusPill tone={course.isActive ? 'completed' : 'lost'}>
                          {course.feeAmount ? `${course.currency} ${course.feeAmount}` : 'Active'}
                        </StatusPill>
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState
                    title="No courses yet"
                    description="Create courses individually or import them in bulk for the counselling team."
                  />
                )}
              </div>
            </section>
          </div>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-slate-900">Bulk Import</h3>
            <p className="mt-2 text-sm text-slate-500">
              Paste a JSON array payload to preview and execute tenant-safe bulk imports.
            </p>
            <div className="mt-6 grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)]">
              <div className="space-y-4">
                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-slate-700">Module</span>
                  <select
                    className={inputClassName}
                    value={importModule}
                    onChange={(event) => setImportModule(event.target.value)}
                  >
                    <option value="universities">Universities</option>
                    <option value="courses">Courses</option>
                  </select>
                </label>
                <button
                  type="button"
                  onClick={handlePreviewImport}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Preview Import
                </button>
                <button
                  type="button"
                  onClick={handleExecuteImport}
                  className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Execute Import
                </button>
              </div>
              <textarea
                rows={10}
                className={inputClassName}
                value={importPayload}
                onChange={(event) => setImportPayload(event.target.value)}
              />
            </div>
            {preview ? (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">
                  Preview: {preview.validRows} valid rows out of {preview.totalRows}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {preview.errors.length} rows need correction before import completes cleanly.
                </p>
              </div>
            ) : null}
            <div className="mt-6 space-y-3">
              {logs.map((log) => (
                <div key={log._id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{log.module}</p>
                      <p className="text-sm text-slate-500">
                        {log.fileName || 'Inline import'} / {new Date(log.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <StatusPill tone={log.status === 'completed' ? 'completed' : 'overdue'}>
                        {log.status}
                      </StatusPill>
                      <StatusPill tone="pending">{log.successCount} success</StatusPill>
                      <StatusPill tone={log.failedCount ? 'overdue' : 'completed'}>
                        {log.failedCount} failed
                      </StatusPill>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </AppShell>
  );
}

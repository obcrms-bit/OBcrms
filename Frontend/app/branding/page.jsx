'use client';

import { useEffect, useMemo, useState } from 'react';
import { Palette, Wand2 } from 'lucide-react';
import AppShell from '@/components/app/app-shell';
import {
  ErrorState,
  LoadingState,
  MetricCard,
} from '@/components/app/shared';
import { platformAPI, branchAPI } from '@/src/services/api';
import { useBranding } from '@/context/BrandingContext';

const inputClassName =
  'w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:bg-white';

const defaultTenantForm = {
  companyName: '',
  logo: '',
  favicon: '',
  primaryColor: '#0f766e',
  secondaryColor: '#0f172a',
  accentColor: '#14b8a6',
  fontFamily: 'Inter',
  loginHeading: '',
  loginSubheading: '',
  supportEmail: '',
  theme: 'light',
};

const defaultBranchForm = {
  branchName: '',
  logo: '',
  favicon: '',
  primaryColor: '',
  secondaryColor: '',
  accentColor: '',
  fontFamily: '',
  loginHeading: '',
  loginSubheading: '',
  inheritFromTenant: true,
};

export default function BrandingPage() {
  const { refreshBranding } = useBranding();
  const [loading, setLoading] = useState(true);
  const [savingTenant, setSavingTenant] = useState(false);
  const [savingBranch, setSavingBranch] = useState(false);
  const [error, setError] = useState('');
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [tenantForm, setTenantForm] = useState(defaultTenantForm);
  const [branchForm, setBranchForm] = useState(defaultBranchForm);
  const [preview, setPreview] = useState(defaultTenantForm);

  const loadPage = async (branchId = selectedBranchId) => {
    setLoading(true);
    setError('');

    try {
      const [brandingResponse, branchesResponse] = await Promise.all([
        platformAPI.getBranding(branchId ? { branchId } : {}),
        branchAPI.getBranches(),
      ]);

      const brandingData = brandingResponse.data?.data || {};
      const branchList = branchesResponse.data?.data || [];
      setBranches(branchList);
      setTenantForm({
        companyName: brandingData.company?.name || '',
        ...(brandingData.tenantBranding || defaultTenantForm),
      });
      setBranchForm({
        ...defaultBranchForm,
        ...(brandingData.branchBranding || {}),
      });
      setPreview({
        ...defaultTenantForm,
        ...(brandingData.effectiveBranding || brandingData.tenantBranding || {}),
      });

      if (!branchId && branchList.length) {
        setSelectedBranchId(branchList[0]._id);
      }
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to load branding workspace.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedBranchId) {
      loadPage(selectedBranchId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBranchId]);

  const cards = useMemo(
    () => [
      {
        label: 'Primary Color',
        value: tenantForm.primaryColor,
        helper: 'Tenant master identity',
        icon: Palette,
        accent: 'bg-slate-900',
      },
      {
        label: 'Accent Color',
        value: tenantForm.accentColor,
        helper: 'Buttons and highlights',
        icon: Wand2,
        accent: 'bg-teal-600',
      },
    ],
    [tenantForm]
  );

  const handleSaveTenant = async (event) => {
    event.preventDefault();
    setSavingTenant(true);
    setError('');

    try {
      await platformAPI.updateBranding({
        scope: 'tenant',
        ...tenantForm,
      });
      await refreshBranding('');
      await loadPage(selectedBranchId);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to save tenant branding.'
      );
    } finally {
      setSavingTenant(false);
    }
  };

  const handleSaveBranch = async (event) => {
    event.preventDefault();
    if (!selectedBranchId) {
      return;
    }

    setSavingBranch(true);
    setError('');

    try {
      await platformAPI.updateBranding({
        scope: 'branch',
        branchId: selectedBranchId,
        ...branchForm,
      });
      await refreshBranding(selectedBranchId);
      await loadPage(selectedBranchId);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to save branch branding.'
      );
    } finally {
      setSavingBranch(false);
    }
  };

  return (
    <AppShell
      title="Branding"
      description="White-label the tenant workspace and override selected branches with their own logos, colours, and login messaging."
    >
      {loading ? <LoadingState label="Loading branding workspace..." /> : null}
      {!loading ? (
        <div className="space-y-6">
          {error ? <ErrorState message={error} onRetry={() => loadPage(selectedBranchId)} /> : null}

          <div className="grid gap-4 xl:grid-cols-2">
            {cards.map((card) => (
              <MetricCard
                key={card.label}
                label={card.label}
                value={card.value}
                helper={card.helper}
                icon={card.icon}
                accent={card.accent}
              />
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
            <form className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm" onSubmit={handleSaveTenant}>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Tenant Branding
                </p>
                <h3 className="mt-2 text-xl font-semibold text-slate-900">
                  Consultancy identity system
                </h3>
              </div>

              {[
                ['companyName', 'Company name'],
                ['logo', 'Logo URL'],
                ['favicon', 'Favicon URL'],
                ['supportEmail', 'Support email'],
                ['fontFamily', 'Font family'],
                ['loginHeading', 'Login heading'],
              ].map(([field, label]) => (
                <label key={field} className="block space-y-2">
                  <span className="text-sm font-semibold text-slate-700">{label}</span>
                  <input
                    className={inputClassName}
                    value={tenantForm[field]}
                    onChange={(event) =>
                      setTenantForm((current) => ({
                        ...current,
                        [field]: event.target.value,
                      }))
                    }
                  />
                </label>
              ))}

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-700">Login subheading</span>
                <textarea
                  rows={3}
                  className={inputClassName}
                  value={tenantForm.loginSubheading}
                  onChange={(event) =>
                    setTenantForm((current) => ({
                      ...current,
                      loginSubheading: event.target.value,
                    }))
                  }
                />
              </label>

              <div className="grid gap-4 md:grid-cols-3">
                {[
                  ['primaryColor', 'Primary'],
                  ['secondaryColor', 'Secondary'],
                  ['accentColor', 'Accent'],
                ].map(([field, label]) => (
                  <label key={field} className="block space-y-2">
                    <span className="text-sm font-semibold text-slate-700">{label}</span>
                    <input
                      type="color"
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-white p-2"
                      value={tenantForm[field]}
                      onChange={(event) =>
                        setTenantForm((current) => ({
                          ...current,
                          [field]: event.target.value,
                        }))
                      }
                    />
                  </label>
                ))}
              </div>

              <button
                type="submit"
                disabled={savingTenant}
                className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
              >
                {savingTenant ? 'Saving...' : 'Save Tenant Branding'}
              </button>
            </form>

            <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Live Preview
                </p>
                <h3 className="mt-2 text-xl font-semibold text-slate-900">
                  White-label experience
                </h3>
              </div>

              <div
                className="overflow-hidden rounded-[2rem] border border-slate-200"
                style={{
                  background: `linear-gradient(135deg, ${preview.secondaryColor} 0%, ${preview.primaryColor} 100%)`,
                  color: '#fff',
                  fontFamily: preview.fontFamily,
                }}
              >
                <div className="border-b border-white/10 px-6 py-4">
                  <p className="text-xs uppercase tracking-[0.25em]" style={{ color: preview.accentColor }}>
                    {preview.companyName}
                  </p>
                  <h4 className="mt-2 text-2xl font-semibold">{preview.loginHeading}</h4>
                  <p className="mt-2 max-w-lg text-sm text-white/80">{preview.loginSubheading}</p>
                </div>
                <div className="grid gap-4 px-6 py-6">
                  <div className="rounded-3xl bg-white/10 p-5 backdrop-blur">
                    <p className="text-sm font-semibold">Dashboard CTA</p>
                    <button
                      type="button"
                      className="mt-4 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-900"
                      style={{ backgroundColor: preview.accentColor }}
                    >
                      Schedule Counselling
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Branch Overrides
              </p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">
                Branch-specific identity
              </h3>
              <label className="mt-6 block space-y-2">
                <span className="text-sm font-semibold text-slate-700">Branch</span>
                <select
                  className={inputClassName}
                  value={selectedBranchId}
                  onChange={(event) => setSelectedBranchId(event.target.value)}
                >
                  <option value="">Select branch</option>
                  {branches.map((branch) => (
                    <option key={branch._id} value={branch._id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </label>
            </section>

            <form className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm" onSubmit={handleSaveBranch}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Branch Theme
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-slate-900">
                    Branch override settings
                  </h3>
                </div>
                <label className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={branchForm.inheritFromTenant}
                    onChange={(event) =>
                      setBranchForm((current) => ({
                        ...current,
                        inheritFromTenant: event.target.checked,
                      }))
                    }
                  />
                  Inherit tenant theme
                </label>
              </div>

              {[
                ['branchName', 'Branch display name'],
                ['logo', 'Branch logo URL'],
                ['fontFamily', 'Branch font family'],
                ['loginHeading', 'Branch login heading'],
              ].map(([field, label]) => (
                <label key={field} className="block space-y-2">
                  <span className="text-sm font-semibold text-slate-700">{label}</span>
                  <input
                    className={inputClassName}
                    value={branchForm[field] || ''}
                    onChange={(event) =>
                      setBranchForm((current) => ({
                        ...current,
                        [field]: event.target.value,
                      }))
                    }
                  />
                </label>
              ))}

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-700">Branch login subheading</span>
                <textarea
                  rows={3}
                  className={inputClassName}
                  value={branchForm.loginSubheading || ''}
                  onChange={(event) =>
                    setBranchForm((current) => ({
                      ...current,
                      loginSubheading: event.target.value,
                    }))
                  }
                />
              </label>

              <div className="grid gap-4 md:grid-cols-3">
                {[
                  ['primaryColor', 'Primary'],
                  ['secondaryColor', 'Secondary'],
                  ['accentColor', 'Accent'],
                ].map(([field, label]) => (
                  <label key={field} className="block space-y-2">
                    <span className="text-sm font-semibold text-slate-700">{label}</span>
                    <input
                      type="color"
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-white p-2"
                      value={branchForm[field] || '#0f766e'}
                      onChange={(event) =>
                        setBranchForm((current) => ({
                          ...current,
                          [field]: event.target.value,
                        }))
                      }
                    />
                  </label>
                ))}
              </div>

              <button
                type="submit"
                disabled={savingBranch || !selectedBranchId}
                className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
              >
                {savingBranch ? 'Saving...' : 'Save Branch Branding'}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}

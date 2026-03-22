'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getDefaultWorkspacePath } from '@/src/apps/shared/routing';
import { publicAPI } from '@/src/services/api';
import { DEFAULT_BRANDING, normalizeBranding } from '@/src/services/branding';
import { getApiBaseUrl } from '@/src/services/runtimeConfig';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, login, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [branding, setBranding] = useState(DEFAULT_BRANDING);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(getDefaultWorkspacePath(user));
    }
  }, [isAuthenticated, isLoading, router, user]);

  useEffect(() => {
    let active = true;

    const loadBranding = async () => {
      if (typeof window === 'undefined') {
        setBranding(DEFAULT_BRANDING);
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const companyId = params.get('companyId') || params.get('tenant');
      const branchId = params.get('branchId');

      if (!companyId) {
        setBranding(DEFAULT_BRANDING);
        return;
      }

      try {
        const response = await publicAPI.getBranding(
          branchId ? { companyId, branchId } : { companyId }
        );
        if (!active) {
          return;
        }
        setBranding(normalizeBranding(response.data?.data?.branding || DEFAULT_BRANDING));
      } catch (requestError) {
        if (active) {
          setBranding(DEFAULT_BRANDING);
        }
      }
    };

    loadBranding();

    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const payload = await login(email, password);
      if (!payload?.token || !payload?.user) {
        throw new Error('Login response is missing token or user data');
      }

      router.replace(getDefaultWorkspacePath(payload?.user));
    } catch (requestError) {
      const isNetworkFailure =
        requestError?.message === 'Network Error' || !requestError?.response;
      setError(
        requestError?.response?.data?.message ||
          (isNetworkFailure
            ? `Unable to reach the backend at ${getApiBaseUrl()}. If the Render service was sleeping, wait a moment and try again.`
            : requestError?.message) ||
          'Unable to sign in with those credentials.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#f8fafc_0%,#ecfeff_50%,#eef2ff_100%)] px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.14)] lg:grid-cols-[1.1fr_0.9fr]">
          <section
            className="hidden p-10 text-white lg:flex lg:flex-col lg:justify-between"
            style={{
              background: `radial-gradient(circle at top left, ${branding.accentColor}3d, transparent 38%), linear-gradient(160deg, ${branding.secondaryColor} 0%, ${branding.primaryColor} 45%, ${branding.secondaryColor} 100%)`,
            }}
          >
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur">
                <ShieldCheck size={16} />
                Internal Access Portal
              </span>
              <h1 className="mt-8 text-4xl font-semibold leading-tight">
                {branding.loginHeading}
              </h1>
              <p className="mt-4 max-w-md text-sm leading-7 text-cyan-50/85">
                {branding.loginSubheading}
              </p>
            </div>

            <div className="grid gap-4 text-sm text-cyan-50/90">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                JWT-protected access with automatic session persistence.
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                Role-aware dashboard routing for admins, managers, and counselors.
              </div>
            </div>
          </section>

          <section className="p-8 sm:p-10">
            <div className="mx-auto max-w-md">
              <div className="mb-8">
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-teal-700">
                  {branding.companyName}
                </p>
                <h2 className="mt-3 text-3xl font-semibold text-slate-900">
                  Welcome back
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Enter your work email and password to continue.
                </p>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Email address
                  </span>
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus-within:border-teal-500 focus-within:bg-white">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <input
                      autoComplete="email"
                      className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="admin@trusteducation.com"
                      type="email"
                      value={email}
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Password
                  </span>
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus-within:border-teal-500 focus-within:bg-white">
                    <LockKeyhole className="h-4 w-4 text-slate-400" />
                    <input
                      autoComplete="current-password"
                      className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Enter your password"
                      type="password"
                      value={password}
                    />
                  </div>
                </label>

                {error ? (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                  </div>
                ) : null}

                <button
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={submitting}
                  type="submit"
                >
                  {submitting ? 'Signing in...' : 'Sign in'}
                </button>
              </form>

              <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                Need a company setup flow? Use the registration endpoints from
                the backend auth module, then return here to sign in.
              </div>

              <div className="mt-4 text-sm text-slate-500">
                <Link className="font-medium text-teal-700 hover:text-teal-800" href="/">
                  Return to workspace
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

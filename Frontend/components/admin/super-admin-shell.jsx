'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Building2,
  CreditCard,
  FileCog,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Search,
  Settings2,
  Shield,
  Sparkles,
  Users,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { getInitials } from '@/components/app/shared';

const NAV_ITEMS = [
  { href: '/admin/overview', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/tenants', label: 'Tenants', icon: Building2 },
  { href: '/admin/onboarding', label: 'Onboarding Wizard', icon: Sparkles },
  { href: '/admin/templates', label: 'Templates', icon: FileCog },
];

export default function SuperAdminShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isLoading && isAuthenticated && user?.role !== 'super_admin') {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isLoading, router, user]);

  const navItems = useMemo(() => NAV_ITEMS, []);

  const handleSearch = (event) => {
    event.preventDefault();
    const query = search.trim();
    router.push(query ? `/admin/tenants?search=${encodeURIComponent(query)}` : '/admin/tenants');
  };

  if (isLoading || !isAuthenticated || user?.role !== 'super_admin') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#ecfeff_0%,#f8fafc_45%,#e2e8f0_100%)] px-4">
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-4 text-sm font-medium text-slate-600 shadow-xl shadow-slate-200/60">
          Preparing owner console...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#f0fdfa_0%,#f8fafc_45%,#e2e8f0_100%)] text-slate-900">
      <div className="mx-auto flex max-w-[1700px] flex-col gap-6 px-4 py-4 lg:grid lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="rounded-[2rem] border border-slate-200 bg-[linear-gradient(180deg,#081225_0%,#0f172a_58%,#115e59_100%)] px-5 py-6 text-slate-200 shadow-[0_32px_90px_rgba(15,23,42,0.35)]">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-400/15 text-teal-300">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-teal-300">
                Owner Control Plane
              </p>
              <h1 className="text-lg font-semibold text-white">SaaS Super Admin</h1>
            </div>
          </div>

          <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-sm font-semibold text-white">
                {getInitials(user?.name)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{user?.name}</p>
                <p className="truncate text-xs text-slate-300">{user?.email}</p>
              </div>
            </div>
            <div className="mt-4 inline-flex rounded-full bg-teal-400/15 px-3 py-1 text-xs font-semibold text-teal-200">
              Platform Owner
            </div>
          </div>

          <nav className="mt-8 space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition',
                    isActive
                      ? 'bg-white text-slate-950 shadow-sm'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-8 space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
            <div className="flex items-center gap-2 text-white">
              <Users className="h-4 w-4 text-teal-300" />
              Platform support ready
            </div>
            <p>
              Monitor tenant health, impersonate safely, apply templates, and keep subscription
              operations under control from one owner workspace.
            </p>
            <div className="grid gap-2 pt-2">
              <Link
                href="/reports"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
              >
                <CreditCard className="h-4 w-4" />
                Revenue Reports
              </Link>
              <Link
                href="/organization"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
              >
                <Settings2 className="h-4 w-4" />
                Tenant Configs
              </Link>
              <Link
                href="/notifications"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
              >
                <LifeBuoy className="h-4 w-4" />
                Support Inbox
              </Link>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </aside>

        <main className="min-w-0">
          <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-[0_30px_80px_rgba(148,163,184,0.18)] backdrop-blur">
            <div className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-center lg:justify-between">
              <form
                className="flex max-w-2xl flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                onSubmit={handleSearch}
              >
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  placeholder="Search tenants, company email, plan, or company ID"
                />
              </form>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/admin/onboarding"
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  <Sparkles className="h-4 w-4" />
                  Create Tenant
                </Link>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  Global owner access
                </div>
              </div>
            </div>

            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

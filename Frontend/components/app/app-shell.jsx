'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  CreditCard,
  Gauge,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Route,
  BellRing,
  ShieldCheck,
  UserSquare2,
  Users,
  Wallet,
} from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { formatRoleLabel, getInitials } from './shared';

const NAV_ITEMS = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    roles: ['super_admin', 'admin', 'manager', 'counselor', 'sales', 'accountant'],
  },
  {
    href: '/leads',
    label: 'Leads',
    icon: Users,
    roles: ['super_admin', 'admin', 'manager', 'counselor', 'sales'],
  },
  {
    href: '/leads/pipeline',
    label: 'Pipeline',
    icon: Route,
    roles: ['super_admin', 'admin', 'manager', 'counselor', 'sales'],
  },
  {
    href: '/follow-ups',
    label: 'Follow-ups',
    icon: BellRing,
    roles: ['super_admin', 'admin', 'manager', 'counselor', 'sales'],
  },
  {
    href: '/students',
    label: 'Students',
    icon: GraduationCap,
    roles: ['super_admin', 'admin', 'manager', 'counselor'],
  },
  {
    href: '/applications',
    label: 'Applications',
    icon: UserSquare2,
    roles: ['super_admin', 'admin', 'manager', 'counselor'],
  },
  {
    href: '/visa',
    label: 'Visa',
    icon: ShieldCheck,
    roles: ['super_admin', 'admin', 'manager', 'counselor'],
  },
  {
    href: '/invoices',
    label: 'Invoices',
    icon: CreditCard,
    roles: ['super_admin', 'admin', 'accountant'],
  },
  {
    href: '/chat',
    label: 'Chat',
    icon: MessageSquare,
    roles: ['super_admin', 'admin', 'manager', 'counselor', 'sales', 'accountant'],
  },
];

export default function AppShell({
  title,
  description,
  children,
  actions,
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading, logout, user } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  const navigationItems = useMemo(() => {
    const userRole = user?.role || '';
    return NAV_ITEMS.filter((item) => item.roles.includes(userRole));
  }, [user?.role]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(160deg,#f8fafc_0%,#ecfeff_35%,#eef2ff_100%)] px-4">
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-4 text-sm font-medium text-slate-600 shadow-xl shadow-slate-200/60">
          Preparing your workspace...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#ecfeff_50%,#f8fafc_100%)] text-slate-900">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-6 px-4 py-4 lg:grid lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-[2rem] border border-slate-200 bg-slate-950 px-5 py-6 text-slate-200 shadow-[0_30px_80px_rgba(15,23,42,0.22)]">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-500/20 text-teal-300">
              <Gauge className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-teal-300/80">
                Trust Education
              </p>
              <h1 className="text-lg font-semibold text-white">CRM Control</h1>
            </div>
          </div>

          <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-sm font-semibold text-white">
                {getInitials(user?.name)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">
                  {user?.name}
                </p>
                <p className="truncate text-xs text-slate-300">
                  {user?.email}
                </p>
              </div>
            </div>
            <div className="mt-4 inline-flex rounded-full bg-teal-400/10 px-3 py-1 text-xs font-semibold text-teal-200">
              {formatRoleLabel(user?.role)}
            </div>
          </div>

          <nav className="mt-8 space-y-2">
            {navigationItems.map((item) => {
              const isActive =
                pathname === item.href || pathname?.startsWith(`${item.href}/`);

              return (
                <Link
                  className={cn(
                    'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition',
                    isActive
                      ? 'bg-white text-slate-950 shadow-sm'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  )}
                  href={item.href}
                  key={item.href}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-8 rounded-3xl border border-white/10 bg-gradient-to-br from-teal-500/15 via-white/5 to-transparent p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-200">
              Deployment Ready
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Frontend requests now use the shared API runtime and role-aware
              navigation.
            </p>
          </div>

          <button
            className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            onClick={logout}
            type="button"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </aside>

        <main className="min-w-0">
          <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-[0_30px_80px_rgba(148,163,184,0.16)] backdrop-blur">
            <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-teal-700">
                  Operational Workspace
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                  {title}
                </h2>
                {description ? (
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                    {description}
                  </p>
                ) : null}
              </div>
              {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
            </header>

            <div className="pt-6">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}

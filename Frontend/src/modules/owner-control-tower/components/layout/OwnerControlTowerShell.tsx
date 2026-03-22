'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import {
  AlertTriangle,
  Building2,
  FileSpreadsheet,
  LayoutDashboard,
  LogOut,
  PlusSquare,
  Shield,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getInitials } from '@/components/app/shared';
import { cn } from '@/lib/utils';
import { isPlatformUser } from '@/src/apps/shared/routing';

const navItems = [
  { href: '/owner-control-tower', label: 'Control Tower', icon: LayoutDashboard },
  { href: '/owner-control-tower/consultancies', label: 'All Consultancies', icon: Building2 },
  { href: '/owner-control-tower/consultancies/new', label: 'Add Consultancy', icon: PlusSquare },
  { href: '/owner-control-tower/imports', label: 'Import History', icon: FileSpreadsheet },
  { href: '/owner-control-tower/alerts', label: 'Alerts & Risks', icon: AlertTriangle },
];

export default function OwnerControlTowerShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isLoading && isAuthenticated && !isPlatformUser(user)) {
      router.replace('/tenant/dashboard');
    }
  }, [isAuthenticated, isLoading, router, user]);

  if (isLoading || !isAuthenticated || !isPlatformUser(user)) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="ds-main-surface text-sm font-medium text-slate-600">
          Preparing owner master control tower...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex max-w-[1700px] flex-col gap-6 px-4 py-4 lg:grid lg:grid-cols-[330px_minmax(0,1fr)]">
        <aside className="rounded-[2rem] bg-[linear-gradient(180deg,#07111f_0%,#0f172a_46%,#115e59_100%)] px-6 py-6 text-slate-200 shadow-[var(--ds-shadow-strong)]">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-400/15 text-teal-300">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-teal-300">
                Owner Workspace
              </p>
              <h1 className="text-lg font-semibold text-white">Master Control Tower</h1>
            </div>
          </div>

          <div className="mt-8 rounded-[1.8rem] border border-white/10 bg-white/5 p-4">
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
              Portfolio owner access
            </div>
          </div>

          <nav className="mt-8 space-y-2">
            {navItems.map((item) => {
              const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition',
                    active
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

          <div className="mt-8 rounded-[1.8rem] border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
            <p className="font-semibold text-white">Built for owner-level supervision</p>
            <p className="mt-2 leading-6">
              Monitor cross-tenant setup quality, imports, workflow drift, and onboarding gaps from
              one executive operating surface.
            </p>
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
          <div className="min-h-full rounded-[2rem] border border-white/70 bg-white/75 p-5 shadow-[var(--ds-shadow-soft)] backdrop-blur md:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

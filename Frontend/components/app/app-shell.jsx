'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Building2,
  CreditCard,
  Gauge,
  Globe2,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Paintbrush2,
  Route,
  Search,
  BellRing,
  ShieldCheck,
  UserSquare2,
  Users,
  Wallet,
  Workflow,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useBranding } from '@/context/BrandingContext';
import { cn } from '@/lib/utils';
import { formatRoleLabel, getInitials } from './shared';
import { hasPermission, normalizeRoleKey } from '@/src/services/access';
import { branchAPI, notificationAPI } from '@/src/services/api';
import {
  getSelectedBranchId,
  setSelectedBranchId as persistSelectedBranchId,
} from '@/src/services/workspace';

const NAV_ITEMS = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    permission: ['dashboards', 'view'],
  },
  {
    href: '/admin',
    label: 'Owner Console',
    icon: ShieldCheck,
    roles: ['super_admin'],
  },
  {
    href: '/leads',
    label: 'Leads',
    icon: Users,
    permission: ['leads', 'view'],
  },
  {
    href: '/leads/pipeline',
    label: 'Pipeline',
    icon: Route,
    permission: ['leads', 'view'],
  },
  {
    href: '/follow-ups',
    label: 'Follow-ups',
    icon: BellRing,
    permission: ['followups', 'view'],
  },
  {
    href: '/students',
    label: 'Students',
    icon: GraduationCap,
    permission: ['leads', 'view'],
  },
  {
    href: '/applications',
    label: 'Applications',
    icon: UserSquare2,
    permission: ['applications', 'view'],
  },
  {
    href: '/visa',
    label: 'Visa',
    icon: ShieldCheck,
    roles: ['super_admin', 'admin', 'manager', 'counselor', 'follow_up_team', 'branch_manager', 'head_office_admin'],
  },
  {
    href: '/invoices',
    label: 'Invoices',
    icon: CreditCard,
    permission: ['accounting', 'view'],
  },
  {
    href: '/chat',
    label: 'Chat',
    icon: MessageSquare,
    roles: ['super_admin', 'admin', 'manager', 'counselor', 'sales', 'accountant', 'follow_up_team', 'frontdesk', 'agent', 'branch_manager', 'head_office_admin', 'application_officer'],
  },
  {
    href: '/organization',
    label: 'Organization',
    icon: ShieldCheck,
    permission: ['settings', 'view'],
  },
  {
    href: '/catalog',
    label: 'Catalog',
    icon: Wallet,
    permission: ['universities', 'view'],
  },
  {
    href: '/transfers',
    label: 'Transfers',
    icon: Route,
    permission: ['transfers', 'view'],
  },
  {
    href: '/commissions',
    label: 'Commissions',
    icon: CreditCard,
    permission: ['commissions', 'view'],
  },
  {
    href: '/reports',
    label: 'Reports',
    icon: Gauge,
    permission: ['reports', 'view'],
  },
  {
    href: '/notifications',
    label: 'Notifications',
    icon: BellRing,
    permission: ['notifications', 'view'],
  },
  {
    href: '/branding',
    label: 'Branding',
    icon: Paintbrush2,
    permission: ['branding', 'view'],
  },
  {
    href: '/integrations',
    label: 'Integrations',
    icon: Globe2,
    permission: ['integrations', 'view'],
  },
  {
    href: '/automations',
    label: 'Automations',
    icon: Workflow,
    permission: ['automations', 'view'],
  },
  {
    href: '/public-forms',
    label: 'Public Forms',
    icon: Route,
    permission: ['publicforms', 'view'],
  },
  {
    href: '/billing',
    label: 'Billing',
    icon: CreditCard,
    permission: ['billing', 'view'],
  },
];

const withAlpha = (hex, alpha) =>
  /^#([0-9a-f]{6})$/i.test(hex || '') ? `${hex}${alpha}` : hex;

export default function AppShell({
  title,
  description,
  children,
  actions,
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading, logout, user } = useAuth();
  const { branding } = useBranding();
  const [workspaceSearch, setWorkspaceSearch] = useState('');
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const brandName = branding?.companyName || user?.company?.name || 'Trust Education CRM';
  const brandPrimary = branding?.primaryColor || '#0f766e';
  const brandSecondary = branding?.secondaryColor || '#0f172a';
  const brandAccent = branding?.accentColor || '#99f6e4';

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    setSelectedBranchId(getSelectedBranchId());
  }, []);

  const navigationItems = useMemo(() => {
    const userRole = normalizeRoleKey(user);
    return NAV_ITEMS.filter((item) => {
      if (item.permission) {
        return hasPermission(user, item.permission[0], item.permission[1]);
      }
      return item.roles?.includes(userRole) || item.roles?.includes(user?.role);
    });
  }, [user]);

  useEffect(() => {
    let active = true;

    const loadWorkspaceMeta = async () => {
      if (!isAuthenticated || !user) {
        return;
      }

      const requests = await Promise.allSettled([
        hasPermission(user, 'branches', 'view') ? branchAPI.getBranches() : Promise.resolve(null),
        hasPermission(user, 'notifications', 'view')
          ? notificationAPI.getNotifications({ unreadOnly: true, limit: 5 })
          : Promise.resolve(null),
      ]);

      if (!active) {
        return;
      }

      setBranches(
        requests[0].status === 'fulfilled' ? requests[0].value?.data?.data || [] : []
      );
      setUnreadCount(
        requests[1].status === 'fulfilled'
          ? requests[1].value?.data?.data?.unreadCount || 0
          : 0
      );
    };

    loadWorkspaceMeta();

    return () => {
      active = false;
    };
  }, [isAuthenticated, user]);

  const handleWorkspaceSearch = (event) => {
    event.preventDefault();
    const nextSearch = workspaceSearch.trim();
    router.push(nextSearch ? `/leads?search=${encodeURIComponent(nextSearch)}` : '/leads');
  };

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
        <aside
          className="rounded-[2rem] border border-slate-200 px-5 py-6 text-slate-200 shadow-[0_30px_80px_rgba(15,23,42,0.22)]"
          style={{
            background: `linear-gradient(180deg, ${brandSecondary} 0%, ${brandPrimary} 100%)`,
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-2xl"
              style={{
                backgroundColor: withAlpha(brandAccent, '22'),
                color: brandAccent,
              }}
            >
              <Gauge className="h-6 w-6" />
            </div>
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-[0.25em]"
                style={{ color: withAlpha(brandAccent, 'dd') }}
              >
                Enterprise SaaS
              </p>
              <h1 className="text-lg font-semibold text-white">{brandName}</h1>
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
            <div
              className="mt-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold"
              style={{
                backgroundColor: withAlpha(brandAccent, '22'),
                color: brandAccent,
              }}
            >
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

          <div
            className="mt-8 rounded-3xl border border-white/10 p-4"
            style={{
              background: `linear-gradient(135deg, ${withAlpha(brandAccent, '22')} 0%, rgba(255,255,255,0.06) 100%)`,
            }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: brandAccent }}>
              Deployment Ready
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Tenant-aware CRM, public lead capture, branding, and enterprise
              navigation now run from the same shared workspace.
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
            <div className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-center lg:justify-between">
              <form
                className="flex max-w-xl flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                onSubmit={handleWorkspaceSearch}
              >
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  placeholder="Search leads, clients, email, or phone"
                  value={workspaceSearch}
                  onChange={(event) => setWorkspaceSearch(event.target.value)}
                />
              </form>

              <div className="flex flex-wrap items-center gap-3">
                {branches.length ? (
                  <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                    <Building2 className="h-4 w-4 text-slate-400" />
                    <select
                      className="bg-transparent outline-none"
                      value={selectedBranchId}
                      onChange={(event) => {
                        const nextBranchId = event.target.value;
                        setSelectedBranchId(nextBranchId);
                        persistSelectedBranchId(nextBranchId);
                      }}
                    >
                      <option value="">All accessible branches</option>
                      {branches.map((branch) => (
                        <option key={branch._id} value={branch._id}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}

                {hasPermission(user, 'notifications', 'view') ? (
                  <Link
                    href="/notifications"
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white"
                  >
                    <BellRing className="h-4 w-4" />
                    <span>Notifications</span>
                    {unreadCount ? (
                      <span className="inline-flex min-w-[1.5rem] items-center justify-center rounded-full bg-rose-500 px-2 py-0.5 text-xs font-semibold text-white">
                        {unreadCount}
                      </span>
                    ) : null}
                  </Link>
                ) : null}

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  {user?.name}
                </div>
              </div>
            </div>

            <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-end md:justify-between">
              <div>
                <p
                  className="text-xs font-semibold uppercase tracking-[0.25em]"
                  style={{ color: brandPrimary }}
                >
                  {brandName}
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

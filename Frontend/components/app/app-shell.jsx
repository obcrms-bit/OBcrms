'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BellRing,
  Building2,
  CreditCard,
  Gauge,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Paintbrush2,
  Route,
  Search,
  UserSquare2,
  Users,
  Workflow,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useBranding } from '@/context/BrandingContext';
import { cn } from '@/lib/utils';
import { formatRoleLabel, getInitials } from './shared';
import { getDefaultWorkspacePath, isPlatformUser } from '@/src/apps/shared/routing';
import { hasPermission, normalizeRoleKey } from '@/src/services/access';
import { branchAPI, notificationAPI } from '@/src/services/api';
import {
  getSelectedBranchId,
  setSelectedBranchId as persistSelectedBranchId,
} from '@/src/services/workspace';

const NAV_ITEMS = [
  {
    href: '/tenant/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    permission: ['dashboards', 'view'],
  },
  {
    href: '/tenant/leads',
    label: 'Leads',
    icon: Users,
    permission: ['leads', 'view'],
  },
  {
    href: '/tenant/pipeline',
    label: 'Pipeline',
    icon: Route,
    permission: ['leads', 'view'],
  },
  {
    href: '/tenant/follow-ups',
    label: 'Follow-ups',
    icon: BellRing,
    permission: ['followups', 'view'],
  },
  {
    href: '/tenant/students',
    label: 'Students',
    icon: GraduationCap,
    permission: ['leads', 'view'],
  },
  {
    href: '/tenant/applications',
    label: 'Applications',
    icon: UserSquare2,
    permission: ['applications', 'view'],
  },
  {
    href: '/tenant/visa',
    label: 'Visa',
    icon: Paintbrush2,
    roles: [
      'admin',
      'tenant_admin',
      'manager',
      'counselor',
      'counsellor',
      'follow_up_team',
      'branch_manager',
      'branch_admin',
      'head_office_admin',
      'application_officer',
    ],
  },
  {
    href: '/tenant/transfers',
    label: 'Transfers',
    icon: Route,
    permission: ['transfers', 'view'],
  },
  {
    href: '/tenant/commissions',
    label: 'Commissions',
    icon: CreditCard,
    permission: ['commissions', 'view'],
  },
  {
    href: '/tenant/reports',
    label: 'Reports',
    icon: Gauge,
    permission: ['reports', 'view'],
  },
  {
    href: '/tenant/branches',
    label: 'Branches',
    icon: Building2,
    permission: ['branches', 'view'],
  },
  {
    href: '/tenant/users',
    label: 'Users',
    icon: Users,
    permission: ['users', 'view'],
  },
  {
    href: '/tenant/automations',
    label: 'Automations',
    icon: Workflow,
    permission: ['automations', 'view'],
  },
  {
    href: '/tenant/forms',
    label: 'Forms',
    icon: Route,
    permission: ['publicforms', 'view'],
  },
  {
    href: '/tenant/settings',
    label: 'Settings',
    icon: Paintbrush2,
    permission: ['settings', 'view'],
  },
];

const withAlpha = (hex, alpha) =>
  /^#([0-9a-f]{6})$/i.test(hex || '') ? `${hex}${alpha}` : hex;

const WORKSPACE_META_CACHE_TTL_MS = 30 * 1000;
const workspaceMetaCache = new Map();

const getWorkspaceMetaCacheKey = (user) =>
  `${user?.id || user?._id || 'anonymous'}:${user?.role || ''}:${user?.updatedAt || ''}`;

/**
 * @param {{
 *   title: any;
 *   description?: any;
 *   children: any;
 *   actions?: any;
 * }} props
 */
export default function AppShell({
  title,
  description = '',
  children,
  actions = null,
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
    if (!isLoading && isAuthenticated && isPlatformUser(user)) {
      router.replace(getDefaultWorkspacePath(user));
    }
  }, [isAuthenticated, isLoading, router, user]);

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

      const canViewBranches = hasPermission(user, 'branches', 'view');
      const canViewNotifications = hasPermission(user, 'notifications', 'view');
      const cacheKey = getWorkspaceMetaCacheKey(user);
      const cachedMeta = workspaceMetaCache.get(cacheKey);

      if (cachedMeta && cachedMeta.expiresAt > Date.now()) {
        const persistedBranchId = getSelectedBranchId();
        const isPersistedBranchAccessible = cachedMeta.branches.some(
          (branch) => String(branch?._id || '') === String(persistedBranchId || '')
        );

        setBranches(cachedMeta.branches);
        setUnreadCount(cachedMeta.unreadCount);

        if (persistedBranchId && cachedMeta.branches.length && !isPersistedBranchAccessible) {
          setSelectedBranchId('');
          persistSelectedBranchId('');
        }

        return;
      }

      const requests = await Promise.allSettled([
        canViewBranches ? branchAPI.getBranches() : Promise.resolve(null),
        canViewNotifications
          ? notificationAPI.getNotifications({ summaryOnly: true })
          : Promise.resolve(null),
      ]);

      if (!active) {
        return;
      }

      const nextBranches =
        requests[0].status === 'fulfilled' ? requests[0].value?.data?.data || [] : [];
      const nextUnreadCount =
        requests[1].status === 'fulfilled'
          ? requests[1].value?.data?.data?.unreadCount || 0
          : 0;
      const persistedBranchId = getSelectedBranchId();
      const isPersistedBranchAccessible = nextBranches.some(
        (branch) => String(branch?._id || '') === String(persistedBranchId || '')
      );

      workspaceMetaCache.set(cacheKey, {
        branches: nextBranches,
        unreadCount: nextUnreadCount,
        expiresAt: Date.now() + WORKSPACE_META_CACHE_TTL_MS,
      });

      setBranches(nextBranches);
      setUnreadCount(nextUnreadCount);

      if (persistedBranchId && nextBranches.length && !isPersistedBranchAccessible) {
        setSelectedBranchId('');
        persistSelectedBranchId('');
      }
    };

    loadWorkspaceMeta();

    return () => {
      active = false;
    };
  }, [isAuthenticated, user]);

  const handleWorkspaceSearch = (event) => {
    event.preventDefault();
    const nextSearch = workspaceSearch.trim();
    router.push(
      nextSearch
        ? `/tenant/leads?search=${encodeURIComponent(nextSearch)}`
        : '/tenant/leads'
    );
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="ds-main-surface text-sm font-medium text-slate-600">
          Preparing your workspace...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-900">
      <div className="ds-shell-grid">
        <aside
          className="ds-sidebar text-slate-200"
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
                Tenant Operations
              </p>
              <h1 className="text-lg font-semibold text-white">{brandName}</h1>
            </div>
          </div>

          <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
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
              {formatRoleLabel(user?.canonicalRole || user?.role)}
            </div>
          </div>

          <nav className="mt-8 space-y-2" aria-label="Primary navigation">
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
            <p
              className="text-xs font-semibold uppercase tracking-[0.2em]"
              style={{ color: brandAccent }}
            >
              Tenant Workspace
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Branch-aware CRM, reports, automations, and operational routing
              stay isolated inside the tenant workspace with permission-aware navigation.
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
          <div className="ds-main-surface">
            <div className="mb-6 flex flex-col gap-4 border-b border-slate-200/80 pb-6 lg:flex-row lg:items-center lg:justify-between">
              <form
                className="flex max-w-xl flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm"
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
                  <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 shadow-sm">
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
                    href="/tenant/follow-ups"
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-white"
                  >
                    <BellRing className="h-4 w-4" />
                    <span>Reminders</span>
                    {unreadCount ? (
                      <span className="inline-flex min-w-[1.5rem] items-center justify-center rounded-full bg-rose-500 px-2 py-0.5 text-xs font-semibold text-white">
                        {unreadCount}
                      </span>
                    ) : null}
                  </Link>
                ) : null}

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 shadow-sm">
                  {user?.name}
                </div>
              </div>
            </div>

            <header className="flex flex-col gap-4 border-b border-slate-200/80 pb-6 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="ds-eyebrow" style={{ color: brandPrimary }}>
                  {brandName}
                </p>
                <h2 className="mt-2 text-[clamp(1.8rem,1.3rem+1.5vw,2.5rem)] font-semibold tracking-tight text-slate-950">
                  {title}
                </h2>
                {description ? (
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
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

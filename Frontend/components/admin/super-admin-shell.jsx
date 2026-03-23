'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Bell,
  Building2,
  ChevronLeft,
  ChevronRight,
  Circle,
  CreditCard,
  FileBarChart2,
  FileCog,
  LayoutDashboard,
  Layers3,
  LogOut,
  Menu,
  MoonStar,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Palette,
  Settings2,
  Shield,
  ShieldAlert,
  Sparkles,
  SunMedium,
  Users,
  Workflow,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { getInitials } from '@/components/app/shared';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  getDefaultWorkspacePath,
  getWorkspaceLabel,
  isPlatformUser,
} from '@/src/apps/shared/routing';
import { superAdminAPI } from '@/src/services/api';
import { hasPermission, normalizeRoleKey } from '@/src/services/access';

const NAV_ITEMS = [
  {
    href: '/platform/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    basePath: '/platform/dashboard',
  },
  {
    href: '/platform/tenants',
    label: 'Tenants',
    icon: Building2,
    basePath: '/platform/tenants',
  },
  {
    href: '/platform/onboarding',
    label: 'Onboarding',
    icon: Sparkles,
    basePath: '/platform/onboarding',
  },
  {
    href: '/platform/import',
    label: 'Import Center',
    icon: FileCog,
    basePath: '/platform/import',
  },
  {
    href: '/platform/ai-insights?focus=funnel',
    label: 'Funnel Monitoring',
    icon: Workflow,
    basePath: '/platform/ai-insights',
    queryKey: 'focus',
    queryValue: 'funnel',
  },
  {
    href: '/platform/billing',
    label: 'Billing',
    icon: CreditCard,
    basePath: '/platform/billing',
  },
  {
    href: '/platform/alerts',
    label: 'Alerts',
    icon: ShieldAlert,
    basePath: '/platform/alerts',
  },
  {
    href: '/platform/audit',
    label: 'Audit Logs',
    icon: FileBarChart2,
    basePath: '/platform/audit',
  },
  {
    href: '/platform/settings?panel=integrations',
    label: 'Integrations',
    icon: Layers3,
    basePath: '/platform/settings',
    panel: 'integrations',
  },
  {
    href: '/platform/settings?panel=branding',
    label: 'White Label',
    icon: Palette,
    basePath: '/platform/settings',
    panel: 'branding',
  },
  {
    href: '/platform/ai-insights?focus=signals',
    label: 'AI Insights',
    icon: Sparkles,
    basePath: '/platform/ai-insights',
    queryKey: 'focus',
    queryValue: 'signals',
  },
  {
    href: '/platform/settings',
    label: 'Settings',
    icon: Settings2,
    basePath: '/platform/settings',
  },
];

const EMPTY_PLATFORM_META = {
  tenantCount: 0,
  activeCount: 0,
  alertCount: 0,
  onboardingCount: 0,
  recentTenants: [],
};

/**
 * @param {{ children: any }} props
 */
export default function SuperAdminShell({ children }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [search, setSearch] = useState('');
  const [tenantFilter, setTenantFilter] = useState('all');
  const [dateRange, setDateRange] = useState(searchParams?.get('range') || '30d');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [platformMeta, setPlatformMeta] = useState(EMPTY_PLATFORM_META);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isLoading && isAuthenticated && !isPlatformUser(user)) {
      router.replace(getDefaultWorkspacePath(user));
    }
  }, [isAuthenticated, isLoading, router, user]);

  useEffect(() => {
    const storedCollapsed = window.localStorage.getItem('platform-sidebar-collapsed');
    const storedTheme = window.localStorage.getItem('platform-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const nextDark = storedTheme ? storedTheme === 'dark' : prefersDark;

    setSidebarCollapsed(storedCollapsed === 'true');
    setIsDark(nextDark);
    document.documentElement.classList.toggle('dark', nextDark);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    window.localStorage.setItem('platform-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  useEffect(() => {
    window.localStorage.setItem(
      'platform-sidebar-collapsed',
      sidebarCollapsed ? 'true' : 'false'
    );
  }, [sidebarCollapsed]);

  useEffect(() => {
    setSearch(searchParams?.get('search') || '');
    setDateRange(searchParams?.get('range') || '30d');
  }, [searchParams]);

  useEffect(() => {
    let isActive = true;

    if (!isLoading && isAuthenticated && isPlatformUser(user)) {
      superAdminAPI
        .getOverview()
        .then((response) => {
          if (!isActive) {
            return;
          }

          const data = response?.data?.data || {};
          const tenants = Array.isArray(data.tenants) ? data.tenants : [];

          setPlatformMeta({
            tenantCount: data?.kpis?.totalTenants || tenants.length,
            activeCount:
              data?.supportTools?.suspendedTenants !== undefined
                ? Math.max(
                    0,
                    (data?.kpis?.totalTenants || tenants.length) -
                      (data?.supportTools?.suspendedTenants || 0)
                  )
                : tenants.filter((tenant) => tenant.status === 'active').length,
            alertCount:
              (data?.supportTools?.pastDueTenants || 0) +
              (data?.supportTools?.onboardingAlerts || 0),
            onboardingCount: data?.supportTools?.onboardingAlerts || 0,
            recentTenants: tenants.slice(0, 8).map((tenant) => ({
              id: tenant.id,
              name: tenant.name,
              status: tenant.status,
            })),
          });
        })
        .catch(() => {
          if (isActive) {
            setPlatformMeta(EMPTY_PLATFORM_META);
          }
        });
    }

    return () => {
      isActive = false;
    };
  }, [isAuthenticated, isLoading, user]);

  const roleKey = normalizeRoleKey(user);
  const canManagePlatform =
    roleKey === 'super_admin' || hasPermission(user, 'platformcontrol', 'manage');
  const userRoleLabel =
    roleKey === 'super_admin'
      ? 'Owner'
      : roleKey === 'super_admin_manager'
        ? 'Platform Manager'
        : 'Platform Team';
  const navItems = useMemo(
    () =>
      NAV_ITEMS.filter((item) =>
        canManagePlatform
          ? true
          : !['Onboarding', 'Import Center', 'White Label', 'Settings'].includes(item.label)
      ),
    [canManagePlatform]
  );
  const currentPanel = searchParams?.get('panel') || '';
  const currentFocus = searchParams?.get('focus') || '';

  const routeMeta = useMemo(() => {
    if (pathname?.startsWith('/platform/tenants')) {
      return {
        title: 'Tenant Management',
        description: 'Global tenant status, readiness, and commercial control.',
      };
    }

    if (pathname?.startsWith('/platform/import')) {
      return {
        title: 'Import Center',
        description: 'Validate and onboard consultancies safely from structured files.',
      };
    }

    if (pathname?.startsWith('/platform/onboarding')) {
      return {
        title: 'Onboarding',
        description: 'Launch new consultancies with owner-level setup visibility.',
      };
    }

    if (pathname?.startsWith('/platform/billing')) {
      return {
        title: 'Billing Overview',
        description: 'Plan mix, recurring revenue, and subscription posture.',
      };
    }

    if (pathname?.startsWith('/platform/alerts')) {
      return {
        title: 'Platform Alerts',
        description: 'The owner watchlist for billing, setup, and trust signals.',
      };
    }

    if (pathname?.startsWith('/platform/ai-insights') && currentFocus === 'funnel') {
      return {
        title: 'Funnel Monitoring',
        description: 'Platform-level funnel, onboarding, and rollout anomalies across all tenants.',
      };
    }

    if (pathname?.startsWith('/platform/ai-insights')) {
      return {
        title: 'AI Insights',
        description: 'Explainable platform signals across onboarding, billing, launch readiness, and tenant health.',
      };
    }

    if (pathname?.startsWith('/platform/audit')) {
      return {
        title: 'Audit Logs',
        description: 'A clean timeline of platform-level actions and visibility events.',
      };
    }

    if (pathname?.startsWith('/platform/settings') && currentPanel === 'integrations') {
      return {
        title: 'Integrations',
        description: 'Platform-wide connectivity, data sync, and external systems.',
      };
    }

    if (pathname?.startsWith('/platform/settings') && currentPanel === 'branding') {
      return {
        title: 'White Label',
        description: 'Global branding controls, domain posture, and experience polish.',
      };
    }

    if (pathname?.startsWith('/platform/settings')) {
      return {
        title: 'Platform Settings',
        description: 'Global controls for owner operations, governance, and configuration.',
      };
    }

    return {
      title: 'Owner Command Center',
      description: 'Centralized visibility and control across every consultancy.',
    };
  }, [currentFocus, currentPanel, pathname]);

  const buildPlatformUrl = (updates = {}) => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    Object.entries(updates).forEach(([key, value]) => {
      if (!value || value === 'all') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    const nextQuery = params.toString();
    return `${pathname}${nextQuery ? `?${nextQuery}` : ''}`;
  };

  const handleSearch = (event) => {
    event.preventDefault();
    const query = search.trim();
    router.push(
      query ? `/platform/tenants?search=${encodeURIComponent(query)}` : '/platform/tenants'
    );
  };

  const handleTenantFilter = (value) => {
    setTenantFilter(value);

    if (value === 'all') {
      return;
    }

    const tenant = platformMeta.recentTenants.find((item) => item.id === value);
    router.push(
      tenant ? `/platform/tenants?search=${encodeURIComponent(tenant.name)}` : '/platform/tenants'
    );
  };

  const handleDateRangeChange = (value) => {
    setDateRange(value);
    router.replace(buildPlatformUrl({ range: value }));
  };

  if (isLoading || !isAuthenticated || !isPlatformUser(user)) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 dark:bg-slate-950">
        <div className="rounded-[28px] border border-slate-200/80 bg-white/95 px-6 py-5 text-sm font-medium text-slate-600 shadow-[0_24px_60px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-950/90 dark:text-slate-300">
          Preparing owner console...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),transparent_22%),linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)] text-slate-900 transition-colors dark:bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.16),transparent_20%),linear-gradient(180deg,#020617_0%,#0f172a_100%)] dark:text-slate-100">
      <div className="mx-auto flex max-w-[1820px] flex-col gap-4 px-4 py-4 lg:flex-row">
        <aside
          className={cn(
            'relative overflow-hidden rounded-[30px] border border-slate-900/10 bg-[linear-gradient(180deg,#081225_0%,#0f172a_52%,#1e3a8a_100%)] px-4 py-5 text-slate-200 shadow-[0_36px_100px_rgba(15,23,42,0.32)] transition-[width] duration-300 ease-out lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] lg:flex-shrink-0 lg:overflow-y-auto',
            sidebarCollapsed ? 'lg:w-[104px]' : 'lg:w-[308px]'
          )}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(45,212,191,0.12),transparent_32%)]" />
          <div className="relative">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-white/10 text-sky-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                  <Shield className="h-6 w-6" />
                </div>
                <div className={cn('min-w-0 transition', sidebarCollapsed && 'lg:hidden')}>
                  <p className="truncate text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-200/90">
                    Platform Owner
                  </p>
                  <h1 className="truncate text-lg font-semibold text-white">
                    Owner Control Center
                  </h1>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSidebarCollapsed((current) => !current)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10"
              >
                <span className="sr-only">Toggle sidebar</span>
                {sidebarCollapsed ? (
                  <>
                    <PanelLeftOpen className="hidden h-4 w-4 lg:block" />
                    <Menu className="h-4 w-4 lg:hidden" />
                  </>
                ) : (
                  <>
                    <PanelLeftClose className="hidden h-4 w-4 lg:block" />
                    <ChevronLeft className="h-4 w-4 lg:hidden" />
                  </>
                )}
              </button>
            </div>

            <div
              className={cn(
                'mt-7 rounded-[26px] border border-white/10 bg-white/5 p-4 backdrop-blur transition',
                sidebarCollapsed && 'lg:px-2'
              )}
            >
              <div
                className={cn(
                  'flex items-center gap-3',
                  sidebarCollapsed && 'lg:justify-center'
                )}
              >
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-white/10 text-sm font-semibold text-white">
                  {getInitials(user?.name)}
                </div>
                <div className={cn('min-w-0 transition', sidebarCollapsed && 'lg:hidden')}>
                  <p className="truncate text-sm font-semibold text-white">{user?.name}</p>
                  <p className="truncate text-xs text-slate-300">{user?.email}</p>
                </div>
              </div>
              <div
                className={cn(
                  'mt-4 flex flex-wrap items-center gap-2',
                  sidebarCollapsed && 'lg:hidden'
                )}
              >
                <span className="inline-flex rounded-full bg-sky-400/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-200">
                  {getWorkspaceLabel(user)}
                </span>
                <span className="inline-flex rounded-full bg-emerald-400/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-200">
                  Full visibility
                </span>
              </div>
            </div>

            <div
              className={cn(
                'mt-6 grid gap-3',
                sidebarCollapsed ? 'lg:grid-cols-1' : 'grid-cols-2'
              )}
            >
              {[
                {
                  label: 'Tenants',
                  value: platformMeta.tenantCount,
                  tone: 'text-white',
                },
                {
                  label: 'Alerts',
                  value: platformMeta.alertCount,
                  tone: 'text-amber-200',
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className={cn(
                    'rounded-[22px] border border-white/10 bg-white/5 px-4 py-3',
                    sidebarCollapsed && 'lg:px-2'
                  )}
                >
                  <p
                    className={cn(
                      'text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300',
                      sidebarCollapsed && 'lg:text-center'
                    )}
                  >
                    {sidebarCollapsed ? item.label.slice(0, 1) : item.label}
                  </p>
                  <p
                    className={cn(
                      'mt-2 text-2xl font-semibold tracking-[-0.04em]',
                      item.tone,
                      sidebarCollapsed && 'lg:text-center'
                    )}
                  >
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            <nav className="mt-7 space-y-1.5" aria-label="Owner navigation">
              {navItems.map((item) => {
                const isActive =
                  pathname?.startsWith(item.basePath) &&
                  (!item.panel || currentPanel === item.panel) &&
                  (!item.queryKey || searchParams?.get(item.queryKey) === item.queryValue);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'group flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-medium transition',
                      isActive
                        ? 'bg-white text-slate-950 shadow-[0_18px_42px_rgba(15,23,42,0.18)]'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    )}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <item.icon
                      className={cn(
                        'h-4 w-4 flex-shrink-0',
                        !isActive && 'text-slate-400 group-hover:text-white'
                      )}
                    />
                    <span className={cn('truncate transition', sidebarCollapsed && 'lg:hidden')}>
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </nav>

            <div
              className={cn(
                'mt-7 space-y-3 rounded-[26px] border border-white/10 bg-white/5 p-4 text-sm text-slate-300',
                sidebarCollapsed && 'lg:px-2'
              )}
            >
              <div
                className={cn(
                  'flex items-center gap-2 text-white',
                  sidebarCollapsed && 'lg:justify-center'
                )}
              >
                <Users className="h-4 w-4 text-sky-300" />
                <span className={cn(sidebarCollapsed && 'lg:hidden')}>Platform status</span>
              </div>
              <div className={cn('space-y-2', sidebarCollapsed && 'lg:hidden')}>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-300">Active tenants</span>
                  <span className="font-semibold text-white">{platformMeta.activeCount}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-300">Onboarding watch</span>
                  <span className="font-semibold text-white">{platformMeta.onboardingCount}</span>
                </div>
              </div>
              <div className={cn('grid gap-2 pt-2', sidebarCollapsed && 'lg:hidden')}>
                <Link
                  href="/platform/billing"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
                >
                  <CreditCard className="h-4 w-4" />
                  Billing Overview
                </Link>
                <Link
                  href="/platform/settings?panel=branding"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
                >
                  <Palette className="h-4 w-4" />
                  White Label
                </Link>
                <Link
                  href="/platform/alerts"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
                >
                  <ShieldAlert className="h-4 w-4" />
                  System Alerts
                </Link>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                logout();
                router.replace('/login');
              }}
              className={cn(
                'mt-7 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10',
                sidebarCollapsed && 'lg:px-0'
              )}
              title={sidebarCollapsed ? 'Logout' : undefined}
            >
              <LogOut className="h-4 w-4" />
              <span className={cn(sidebarCollapsed && 'lg:hidden')}>Logout</span>
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="relative">
            <div className="sticky top-4 z-30 rounded-[30px] border border-slate-200/80 bg-white/88 px-4 py-4 shadow-[0_26px_80px_rgba(15,23,42,0.1)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/84 dark:shadow-[0_28px_90px_rgba(2,6,23,0.45)]">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-8 items-center rounded-full bg-slate-100 px-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                      Platform Console
                    </span>
                    <span className="hidden items-center gap-2 text-xs font-medium text-slate-400 dark:text-slate-500 md:inline-flex">
                      <Circle className="h-2.5 w-2.5 fill-emerald-400 text-emerald-400" />
                      Owner-grade access
                    </span>
                  </div>
                  <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-950 dark:text-slate-50">
                    {routeMeta.title}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {routeMeta.description}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsDark((current) => !current)}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
                  >
                    <span className="sr-only">Toggle theme</span>
                    {isDark ? (
                      <SunMedium className="h-4 w-4" />
                    ) : (
                      <MoonStar className="h-4 w-4" />
                    )}
                  </button>
                  <Link
                    href="/platform/alerts"
                    className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
                  >
                    <Bell className="h-4 w-4" />
                    {platformMeta.alertCount ? (
                      <span className="absolute right-2 top-2 inline-flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
                        {platformMeta.alertCount}
                      </span>
                    ) : null}
                  </Link>
                  {canManagePlatform ? (
                    <Link
                      href="/platform/onboarding"
                      className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white"
                    >
                      <Sparkles className="h-4 w-4" />
                      Quick Create
                    </Link>
                  ) : null}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="flex items-center gap-3 rounded-[24px] border border-slate-200 bg-white px-3 py-2 text-left transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold text-white dark:bg-slate-100 dark:text-slate-950">
                          {getInitials(user?.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-950 dark:text-slate-100">
                            {user?.name}
                          </p>
                          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                            {userRoleLabel}
                          </p>
                        </div>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => router.push('/platform/dashboard')}>
                        Dashboard
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push('/platform/settings')}>
                        Settings
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push('/platform/audit')}>
                        Audit Logs
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => {
                          logout();
                          router.replace('/login');
                        }}
                      >
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1.3fr)_220px_160px_auto]">
                <form
                  className="flex items-center gap-3 rounded-[24px] border border-slate-200 bg-slate-50/90 px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/70"
                  onSubmit={handleSearch}
                >
                  <Search className="h-4 w-4 text-slate-400" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
                    placeholder="Search tenants, owner emails, plans, or company IDs"
                  />
                </form>

                <select
                  value={tenantFilter}
                  onChange={(event) => handleTenantFilter(event.target.value)}
                  className="h-12 rounded-[24px] border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                >
                  <option value="all">Tenant filter</option>
                  {platformMeta.recentTenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </option>
                  ))}
                </select>

                <select
                  value={dateRange}
                  onChange={(event) => handleDateRangeChange(event.target.value)}
                  className="h-12 rounded-[24px] border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                >
                  <option value="7d">Last 7d</option>
                  <option value="30d">Last 30d</option>
                  <option value="90d">Last 90d</option>
                  <option value="365d">Last 12m</option>
                </select>

                <div className="flex items-center justify-between gap-3 rounded-[24px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                  <div>
                    <p className="font-semibold text-slate-950 dark:text-slate-100">
                      {platformMeta.tenantCount} tenants
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {platformMeta.alertCount} need attention
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </div>
              </div>
            </div>

            <div className="pt-5">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}

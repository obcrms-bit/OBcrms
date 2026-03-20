'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  authAPI,
  branchAPI,
  dashboardAPI,
  leadAPI,
  notificationAPI,
  organizationAPI,
  reportAPI,
  superAdminAPI,
} from '@/src/services/api';
import { extractApiData, getApiErrorMessage } from '@/src/services/apiUtils';

const AppDataContext = createContext(null);

const INITIAL_TENANT_STATE = {
  overview: null,
  tenants: [],
  tenantDetail: null,
  loadingOverview: false,
  loadingTenants: false,
  loadingTenantDetail: false,
  error: '',
};

const INITIAL_USER_STATE = {
  users: [],
  branches: [],
  roles: [],
  permissionBundles: [],
  loadingUsers: false,
  loadingBranches: false,
  loadingRoles: false,
  error: '',
};

const INITIAL_LEAD_STATE = {
  list: [],
  pagination: { total: 0, page: 1, pages: 1, limit: 20 },
  activeLead: null,
  followUps: [],
  followUpSummary: null,
  loadingLeads: false,
  loadingLeadDetail: false,
  loadingFollowUps: false,
  error: '',
};

const INITIAL_DASHBOARD_STATE = {
  summary: null,
  stats: null,
  reports: null,
  notifications: [],
  notificationMeta: { unreadCount: 0, byType: [] },
  loadingDashboard: false,
  loadingReports: false,
  loadingNotifications: false,
  error: '',
};

const useAppDataContext = () => {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('AppDataStore hooks must be used within AppDataProvider');
  }
  return context;
};

export function AppDataProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [tenantState, setTenantState] = useState(INITIAL_TENANT_STATE);
  const [userState, setUserState] = useState(INITIAL_USER_STATE);
  const [leadState, setLeadState] = useState(INITIAL_LEAD_STATE);
  const [dashboardState, setDashboardState] = useState(INITIAL_DASHBOARD_STATE);

  useEffect(() => {
    if (!isAuthenticated) {
      setTenantState(INITIAL_TENANT_STATE);
      setUserState(INITIAL_USER_STATE);
      setLeadState(INITIAL_LEAD_STATE);
      setDashboardState(INITIAL_DASHBOARD_STATE);
    }
  }, [isAuthenticated]);

  const loadOverview = useCallback(async () => {
    setTenantState((current) => ({
      ...current,
      loadingOverview: true,
      error: '',
    }));

    try {
      const response = await superAdminAPI.getOverview();
      const overview = extractApiData(response);
      setTenantState((current) => ({
        ...current,
        overview,
        loadingOverview: false,
      }));
      return overview;
    } catch (error) {
      const message = getApiErrorMessage(error, 'Failed to load owner overview.');
      setTenantState((current) => ({
        ...current,
        loadingOverview: false,
        error: message,
      }));
      throw error;
    }
  }, []);

  const loadTenants = useCallback(async (params = {}) => {
    setTenantState((current) => ({
      ...current,
      loadingTenants: true,
      error: '',
    }));

    try {
      const response = await superAdminAPI.listTenants(params);
      const data = extractApiData(response) || {};
      const tenants = data.tenants || [];
      setTenantState((current) => ({
        ...current,
        tenants,
        loadingTenants: false,
      }));
      return tenants;
    } catch (error) {
      const message = getApiErrorMessage(error, 'Failed to load tenants.');
      setTenantState((current) => ({
        ...current,
        loadingTenants: false,
        error: message,
      }));
      throw error;
    }
  }, []);

  const loadTenantDetail = useCallback(async (tenantId) => {
    setTenantState((current) => ({
      ...current,
      loadingTenantDetail: true,
      error: '',
    }));

    try {
      const response = await superAdminAPI.getTenantDetail(tenantId);
      const tenantDetail = extractApiData(response);
      setTenantState((current) => ({
        ...current,
        tenantDetail,
        loadingTenantDetail: false,
      }));
      return tenantDetail;
    } catch (error) {
      const message = getApiErrorMessage(error, 'Failed to load tenant detail.');
      setTenantState((current) => ({
        ...current,
        loadingTenantDetail: false,
        error: message,
      }));
      throw error;
    }
  }, []);

  const loadUsers = useCallback(async (params = {}) => {
    setUserState((current) => ({
      ...current,
      loadingUsers: true,
      error: '',
    }));

    try {
      const response = await authAPI.getUsers(params.role);
      const data = extractApiData(response) || {};
      const users = data.users || data || [];
      setUserState((current) => ({
        ...current,
        users,
        loadingUsers: false,
      }));
      return users;
    } catch (error) {
      const message = getApiErrorMessage(error, 'Failed to load users.');
      setUserState((current) => ({
        ...current,
        loadingUsers: false,
        error: message,
      }));
      throw error;
    }
  }, []);

  const loadBranches = useCallback(async () => {
    setUserState((current) => ({
      ...current,
      loadingBranches: true,
      error: '',
    }));

    try {
      const response = await branchAPI.getBranches();
      const branches = extractApiData(response) || [];
      setUserState((current) => ({
        ...current,
        branches,
        loadingBranches: false,
      }));
      return branches;
    } catch (error) {
      const message = getApiErrorMessage(error, 'Failed to load branches.');
      setUserState((current) => ({
        ...current,
        loadingBranches: false,
        error: message,
      }));
      throw error;
    }
  }, []);

  const loadRoles = useCallback(async () => {
    setUserState((current) => ({
      ...current,
      loadingRoles: true,
      error: '',
    }));

    try {
      const [rolesResponse, bundlesResponse] = await Promise.all([
        organizationAPI.getRoles(),
        organizationAPI.getPermissionBundles(),
      ]);

      const roles = extractApiData(rolesResponse)?.roles || [];
      const permissionBundles = extractApiData(bundlesResponse)?.permissionBundles || [];
      setUserState((current) => ({
        ...current,
        roles,
        permissionBundles,
        loadingRoles: false,
      }));
      return { roles, permissionBundles };
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        'Failed to load roles and permission bundles.'
      );
      setUserState((current) => ({
        ...current,
        loadingRoles: false,
        error: message,
      }));
      throw error;
    }
  }, []);

  const loadLeads = useCallback(async (params = {}) => {
    setLeadState((current) => ({
      ...current,
      loadingLeads: true,
      error: '',
    }));

    try {
      const response = await leadAPI.getLeads(params);
      const data = extractApiData(response) || {};
      setLeadState((current) => ({
        ...current,
        list: data.leads || [],
        pagination:
          data.pagination || INITIAL_LEAD_STATE.pagination,
        loadingLeads: false,
      }));
      return data;
    } catch (error) {
      const message = getApiErrorMessage(error, 'Failed to load leads.');
      setLeadState((current) => ({
        ...current,
        loadingLeads: false,
        error: message,
      }));
      throw error;
    }
  }, []);

  const loadLeadById = useCallback(async (leadId) => {
    setLeadState((current) => ({
      ...current,
      loadingLeadDetail: true,
      error: '',
    }));

    try {
      const response = await leadAPI.getLeadById(leadId);
      const lead = extractApiData(response);
      setLeadState((current) => ({
        ...current,
        activeLead: lead,
        loadingLeadDetail: false,
      }));
      return lead;
    } catch (error) {
      const message = getApiErrorMessage(error, 'Failed to load lead details.');
      setLeadState((current) => ({
        ...current,
        loadingLeadDetail: false,
        error: message,
      }));
      throw error;
    }
  }, []);

  const loadFollowUps = useCallback(async (params = {}) => {
    setLeadState((current) => ({
      ...current,
      loadingFollowUps: true,
      error: '',
    }));

    try {
      const [listResponse, summaryResponse] = await Promise.all([
        leadAPI.getFollowUps(params),
        leadAPI.getFollowUpSummary(params.branchId ? { branchId: params.branchId } : {}),
      ]);

      const listData = extractApiData(listResponse) || {};
      const summaryData = extractApiData(summaryResponse) || null;
      setLeadState((current) => ({
        ...current,
        followUps: listData.followUps || [],
        followUpSummary: summaryData,
        loadingFollowUps: false,
      }));
      return {
        followUps: listData.followUps || [],
        summary: summaryData,
        pagination: listData.pagination || null,
      };
    } catch (error) {
      const message = getApiErrorMessage(error, 'Failed to load follow-ups.');
      setLeadState((current) => ({
        ...current,
        loadingFollowUps: false,
        error: message,
      }));
      throw error;
    }
  }, []);

  const loadDashboard = useCallback(async (params = {}, includeStats = true) => {
    setDashboardState((current) => ({
      ...current,
      loadingDashboard: true,
      error: '',
    }));

    try {
      const [summaryResponse, statsResponse] = await Promise.all([
        leadAPI.getFollowUpSummary(params),
        includeStats ? dashboardAPI.getDashboardStats(params) : Promise.resolve(null),
      ]);

      const summary = extractApiData(summaryResponse) || null;
      const stats = includeStats && statsResponse ? extractApiData(statsResponse) : null;

      setDashboardState((current) => ({
        ...current,
        summary,
        stats,
        loadingDashboard: false,
      }));
      return { summary, stats };
    } catch (error) {
      const message = getApiErrorMessage(error, 'Failed to load dashboard.');
      setDashboardState((current) => ({
        ...current,
        loadingDashboard: false,
        error: message,
      }));
      throw error;
    }
  }, []);

  const loadReports = useCallback(async (params = {}) => {
    setDashboardState((current) => ({
      ...current,
      loadingReports: true,
      error: '',
    }));

    try {
      const response = await reportAPI.getSummary(params);
      const reports = extractApiData(response);
      setDashboardState((current) => ({
        ...current,
        reports,
        loadingReports: false,
      }));
      return reports;
    } catch (error) {
      const message = getApiErrorMessage(error, 'Failed to load reports.');
      setDashboardState((current) => ({
        ...current,
        loadingReports: false,
        error: message,
      }));
      throw error;
    }
  }, []);

  const loadNotifications = useCallback(async (params = {}) => {
    setDashboardState((current) => ({
      ...current,
      loadingNotifications: true,
      error: '',
    }));

    try {
      const response = await notificationAPI.getNotifications(params);
      const data = extractApiData(response) || {};
      setDashboardState((current) => ({
        ...current,
        notifications: data.notifications || [],
        notificationMeta: {
          unreadCount: data.unreadCount || 0,
          byType: data.byType || [],
        },
        loadingNotifications: false,
      }));
      return data;
    } catch (error) {
      const message = getApiErrorMessage(error, 'Failed to load notifications.');
      setDashboardState((current) => ({
        ...current,
        loadingNotifications: false,
        error: message,
      }));
      throw error;
    }
  }, []);

  const value = useMemo(
    () => ({
      tenantStore: {
        ...tenantState,
        loadOverview,
        loadTenants,
        loadTenantDetail,
      },
      userStore: {
        ...userState,
        loadUsers,
        loadBranches,
        loadRoles,
      },
      leadStore: {
        ...leadState,
        loadLeads,
        loadLeadById,
        loadFollowUps,
      },
      dashboardStore: {
        ...dashboardState,
        loadDashboard,
        loadReports,
        loadNotifications,
      },
    }),
    [
      dashboardState,
      leadState,
      loadBranches,
      loadDashboard,
      loadFollowUps,
      loadLeadById,
      loadLeads,
      loadNotifications,
      loadOverview,
      loadReports,
      loadRoles,
      loadTenantDetail,
      loadTenants,
      loadUsers,
      tenantState,
      userState,
    ]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export const useTenantStore = () => useAppDataContext().tenantStore;

export const useUserStore = () => useAppDataContext().userStore;

export const useLeadStore = () => useAppDataContext().leadStore;

export const useDashboardStore = () => useAppDataContext().dashboardStore;

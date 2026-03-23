'use client';

import { useAuth } from '@/context/AuthContext';
import { normalizeRoleKey } from '@/src/services/access';
import SuperAdminDashboard from '../components/SuperAdminDashboard';
import AdminDashboard from '../components/AdminDashboard';
import StaffDashboard from '../components/StaffDashboard';
import { LoadingState } from '@/components/app/shared';

export default function DashboardRouter() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingState label="Authenticating..." />;
  }

  const roleKey = normalizeRoleKey(user);

  if (roleKey === 'super_admin_manager' || roleKey === 'super_admin') {
    return <SuperAdminDashboard />;
  }

  if (roleKey === 'head_office_admin' || roleKey === 'admin') {
    return <AdminDashboard />;
  }

  return <StaffDashboard />;
}

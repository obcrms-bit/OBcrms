export type Role =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "STAFF"
  | "superadmin"
  | "admin"
  | "branch_manager"
  | "counselor"
  | "staff";

export type UserRole = Role;

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  companyId?: string;
  tenantId?: string;
  branding?: any;
}

export interface AuthUser extends User {}
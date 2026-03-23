export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'STAFF' | 'MANAGER' | 'COUNSELOR' | 'admin' | 'counselor';

export type UserRole = Role;

export interface User {
  id: string;
  userId?: string;
  name: string;
  email: string;
  role: Role;
  companyId?: string;
}
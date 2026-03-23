import { Role } from './auth';

// Define exact system modules
export type AppModule =
    | 'LEADS'
    | 'STUDENTS'
    | 'APPLICATIONS'
    | 'BRANCHES'
    | 'USERS'
    | 'BILLING'
    | 'TENANT_SETTINGS'
    | 'PLATFORM_SETTINGS';

// Define actions
export type Action = 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'MANAGE';

// Mock implementation of an RBAC matrix. 
// In production, this maps against the user's specific custom Role object fetched from the DB.
const defaultRoleMatrix: Record<Role, Partial<Record<AppModule, Action[]>>> = {
    SUPER_ADMIN: {
        PLATFORM_SETTINGS: ['MANAGE'],
        BILLING: ['MANAGE'],
        TENANT_SETTINGS: ['READ', 'UPDATE'],
    },
    ADMIN: {
        LEADS: ['MANAGE'],
        STUDENTS: ['MANAGE'],
        APPLICATIONS: ['MANAGE'],
        BRANCHES: ['MANAGE'],
        USERS: ['MANAGE'],
        TENANT_SETTINGS: ['MANAGE'],
        BILLING: ['READ'],
    },
    STAFF: {
        LEADS: ['CREATE', 'READ', 'UPDATE'],
        STUDENTS: ['READ', 'UPDATE'],
        APPLICATIONS: ['CREATE', 'READ', 'UPDATE'],
        BRANCHES: ['READ'],
    }
};

export const checkPermission = (
    userRole: Role | undefined,
    module: AppModule,
    action: Action
): boolean => {
    if (!userRole) return false;
    if (userRole === 'SUPER_ADMIN' && module !== 'PLATFORM_SETTINGS') return true; // Super admin bypass for tenant data during impersonation

    const allowedActions = defaultRoleMatrix[userRole]?.[module] || [];
    return allowedActions.includes('MANAGE') || allowedActions.includes(action);
};
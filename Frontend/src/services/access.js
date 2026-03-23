export const normalizeRoleKey = (user) =>
  String(user?.primaryRoleKey || user?.role || '')
    .trim()
    .toLowerCase();

export const getPermissionMatch = (user, moduleKey, action = 'view') => {
  const permissions = Array.isArray(user?.effectivePermissions)
    ? user.effectivePermissions
    : [];
  return permissions.find(
    (permission) =>
      permission?.module === moduleKey &&
      (permission.actions?.includes('manage') ||
        permission.actions?.includes('full_access') ||
        permission.actions?.includes(action))
  );
};

export const hasPermission = (user, moduleKey, action = 'view') => {
  const roleKey = normalizeRoleKey(user);
  if (['super_admin', 'head_office_admin'].includes(roleKey)) {
    return true;
  }
  return Boolean(getPermissionMatch(user, moduleKey, action));
};

export const getEntityLabel = (record, fallback = 'Client') => {
  if (record?.serviceType === 'test_prep' || record?.entityType === 'student') {
    return 'Student';
  }
  if (record?.serviceType === 'consultancy' || record?.entityType === 'client') {
    return 'Client';
  }
  return fallback;
};

import { getStoredTenantId, getStoredUser } from './session';

export const WORKSPACE_BRANCH_EVENT = 'trust-workspace-branch-change';
const WORKSPACE_BRANCH_KEY_PREFIX = 'trust:selectedBranchId';
const LEGACY_WORKSPACE_BRANCH_KEY = 'trust:selectedBranchId';

const canUseBrowserStorage = () => typeof window !== 'undefined';

const getCurrentWorkspaceContext = () => {
  const user = getStoredUser();
  const tenantId = String(
    getStoredTenantId() || user?.tenantId || user?.companyId || ''
  ).trim();
  const userId = String(user?.id || user?._id || '').trim();

  return {
    tenantId,
    userId,
    user,
  };
};

const getScopedWorkspaceBranchKey = () => {
  const { tenantId, userId } = getCurrentWorkspaceContext();

  if (tenantId && userId) {
    return `${WORKSPACE_BRANCH_KEY_PREFIX}:${tenantId}:${userId}`;
  }

  if (tenantId) {
    return `${WORKSPACE_BRANCH_KEY_PREFIX}:${tenantId}`;
  }

  return LEGACY_WORKSPACE_BRANCH_KEY;
};

const getAccessibleBranchIds = (user) => {
  if (!user) {
    return [];
  }

  const branchIds = [
    user?.branchId?._id,
    user?.branchId,
    ...(Array.isArray(user?.additionalBranchIds) ? user.additionalBranchIds : []),
    ...(Array.isArray(user?.accessibleBranchIds) ? user.accessibleBranchIds : []),
  ]
    .map((value) => String(value?._id || value || '').trim())
    .filter(Boolean);

  return Array.from(new Set(branchIds));
};

const clearLegacyWorkspaceBranchKey = () => {
  if (!canUseBrowserStorage()) {
    return;
  }

  window.localStorage.removeItem(LEGACY_WORKSPACE_BRANCH_KEY);
};

export const clearStoredWorkspaceSelection = () => {
  if (!canUseBrowserStorage()) {
    return;
  }

  const keysToRemove = [];
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (
      key &&
      (key === LEGACY_WORKSPACE_BRANCH_KEY ||
        key.startsWith(`${WORKSPACE_BRANCH_KEY_PREFIX}:`))
    ) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => window.localStorage.removeItem(key));
};

export const getSelectedBranchId = () => {
  if (!canUseBrowserStorage()) {
    return '';
  }

  const scopedKey = getScopedWorkspaceBranchKey();
  const selectedBranchId = String(
    window.localStorage.getItem(scopedKey) || ''
  ).trim();
  const { user } = getCurrentWorkspaceContext();

  clearLegacyWorkspaceBranchKey();

  if (!selectedBranchId) {
    return '';
  }

  const accessibleBranchIds = getAccessibleBranchIds(user);

  if (user && !user.isHeadOffice && !accessibleBranchIds.length) {
    window.localStorage.removeItem(scopedKey);
    return '';
  }

  if (!user?.isHeadOffice && accessibleBranchIds.length) {
    const isAccessible = accessibleBranchIds.includes(selectedBranchId);
    if (!isAccessible) {
      window.localStorage.removeItem(scopedKey);
      return '';
    }
  }

  return selectedBranchId;
};

export const setSelectedBranchId = (branchId) => {
  if (!canUseBrowserStorage()) {
    return;
  }

  const scopedKey = getScopedWorkspaceBranchKey();
  const nextValue = String(branchId || '').trim();

  clearLegacyWorkspaceBranchKey();

  if (nextValue) {
    window.localStorage.setItem(scopedKey, nextValue);
  } else {
    window.localStorage.removeItem(scopedKey);
  }

  window.dispatchEvent(
    new CustomEvent(WORKSPACE_BRANCH_EVENT, {
      detail: { branchId: nextValue },
    })
  );
};

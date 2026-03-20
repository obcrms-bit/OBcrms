export const WORKSPACE_BRANCH_EVENT = 'trust-workspace-branch-change';
const WORKSPACE_BRANCH_KEY = 'trust:selectedBranchId';

export const getSelectedBranchId = () => {
  if (typeof window === 'undefined') {
    return '';
  }

  return window.localStorage.getItem(WORKSPACE_BRANCH_KEY) || '';
};

export const setSelectedBranchId = (branchId) => {
  if (typeof window === 'undefined') {
    return;
  }

  const nextValue = String(branchId || '');
  if (nextValue) {
    window.localStorage.setItem(WORKSPACE_BRANCH_KEY, nextValue);
  } else {
    window.localStorage.removeItem(WORKSPACE_BRANCH_KEY);
  }

  window.dispatchEvent(
    new CustomEvent(WORKSPACE_BRANCH_EVENT, {
      detail: { branchId: nextValue },
    })
  );
};

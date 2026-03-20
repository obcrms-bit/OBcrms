const DEFAULT_BRANDING = {
  companyName: 'Trust Education CRM',
  logo: '',
  favicon: '',
  primaryColor: '#0f766e',
  secondaryColor: '#0f172a',
  accentColor: '#14b8a6',
  fontFamily: 'Inter',
  loginHeading: 'Sign in to your education operations workspace',
  loginSubheading:
    'Manage counselling, applications, billing, and branch operations from one tenant-safe CRM.',
  theme: 'light',
};

const normalizeString = (value, fallback = '') =>
  typeof value === 'string' && value.trim() ? value.trim() : fallback;

const sanitizeHexColor = (value, fallback) => {
  const candidate = normalizeString(value, fallback);
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(candidate) ? candidate : fallback;
};

const normalizeBranding = (value = {}) => ({
  logo: normalizeString(value.logo),
  favicon: normalizeString(value.favicon),
  primaryColor: sanitizeHexColor(value.primaryColor, DEFAULT_BRANDING.primaryColor),
  secondaryColor: sanitizeHexColor(value.secondaryColor, DEFAULT_BRANDING.secondaryColor),
  accentColor: sanitizeHexColor(value.accentColor, DEFAULT_BRANDING.accentColor),
  fontFamily: normalizeString(value.fontFamily, DEFAULT_BRANDING.fontFamily),
  loginHeading: normalizeString(value.loginHeading, DEFAULT_BRANDING.loginHeading),
  loginSubheading: normalizeString(value.loginSubheading, DEFAULT_BRANDING.loginSubheading),
});

const getEffectiveBranding = (company, branch = null, override = null) => {
  const companySettings = company?.settings || {};
  const tenantBranding = {
    ...DEFAULT_BRANDING,
    companyName: company?.name || DEFAULT_BRANDING.companyName,
    theme: companySettings.theme || DEFAULT_BRANDING.theme,
    ...normalizeBranding(companySettings),
    supportEmail: companySettings.supportEmail || company?.email || '',
  };

  const branchBranding = branch?.branding || {};
  const resolvedBranchBranding =
    branch && branchBranding.inheritFromTenant === false
      ? {
        ...tenantBranding,
        companyName: branchBranding.branchName || branch?.name || tenantBranding.companyName,
        ...normalizeBranding(branchBranding),
        inheritFromTenant: false,
      }
      : {
        ...tenantBranding,
        companyName: branch?.name || tenantBranding.companyName,
        inheritFromTenant: true,
      };

  if (!override) {
    return resolvedBranchBranding;
  }

  return {
    ...resolvedBranchBranding,
    ...normalizeBranding(override),
  };
};

module.exports = {
  DEFAULT_BRANDING,
  getEffectiveBranding,
  normalizeBranding,
  sanitizeHexColor,
};

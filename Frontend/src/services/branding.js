export const DEFAULT_BRANDING = {
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
  supportEmail: '',
};

export const normalizeBranding = (value = {}) => ({
  ...DEFAULT_BRANDING,
  ...value,
});

export const applyBrandingToDocument = (branding) => {
  if (typeof document === 'undefined') {
    return;
  }

  const nextBranding = normalizeBranding(branding);
  const root = document.documentElement;
  root.style.setProperty('--brand-primary', nextBranding.primaryColor);
  root.style.setProperty('--brand-secondary', nextBranding.secondaryColor);
  root.style.setProperty('--brand-accent', nextBranding.accentColor);
  root.style.setProperty('--brand-font-family', nextBranding.fontFamily || DEFAULT_BRANDING.fontFamily);
};

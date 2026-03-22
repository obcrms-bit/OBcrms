export const LEAD_SOURCES = [
  'website',
  'facebook',
  'instagram',
  'walk-in',
  'referral',
  'tiktok',
  'youtube',
  'event',
  'other',
];

export const LEAD_STATUSES = [
  'new',
  'contacted',
  'qualified',
  'counselling_scheduled',
  'counselling_done',
  'application_started',
  'documents_pending',
  'application_submitted',
  'offer_received',
  'visa_applied',
  'enrolled',
  'lost',
];

export const buildLeadFilters = (branch = '') => ({
  search: '',
  status: '',
  source: '',
  category: '',
  viewScope: '',
  transferredOnly: false,
  branch,
  course: '',
  fromDate: '',
  toDate: '',
});

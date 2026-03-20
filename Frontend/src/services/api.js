import api from './apiClient';

// ==================== AUTH ====================
export const authAPI = {
  registerCompany: (companyName, email, password, name, country) =>
    api.post('/auth/register/company', {
      companyName,
      email,
      password,
      name,
      country,
    }),
  register: (name, email, password, role = 'counselor') =>
    api.post('/auth/register', { name, email, password, role }),
  login: (email, password) =>
    api.post(
      '/auth/login',
      { email, password },
      { skipAuthHandling: true, timeout: 60000 }
    ),
  getMe: () => api.get('/auth/me'),
  getUsers: (role) => api.get('/auth/users', { params: role ? { role } : {} }),
};

export const userAPI = {
  list: (params = {}) => api.get('/auth/users', { params }),
  create: (data) => api.post('/auth/register', data),
  updateAccess: (id, data) => api.patch(`/organization/users/${id}`, data),
};

export const roleAPI = {
  list: () => api.get('/organization/roles'),
  create: (data) => api.post('/organization/roles', data),
  getPermissionBundles: () => api.get('/organization/permission-bundles'),
};

// ==================== LEADS (CRM) ====================
export const leadAPI = {
  getLeads: (params = {}) => api.get('/leads', { params }),
  getWorkflows: () => api.get('/leads/workflows'),
  createLead: (data) => api.post('/leads', data),
  getLeadById: (id) => api.get(`/leads/${id}`),
  updateLead: (id, data) => api.put(`/leads/${id}`, data),
  deleteLead: (id) => api.delete(`/leads/${id}`),
  getPipeline: (params = {}) => api.get('/leads/pipeline', { params }),
  getDueFollowUps: (params = {}) => api.get('/leads/followups/due', { params }),
  getFollowUps: (params = {}) => api.get('/leads/followups', { params }),
  getFollowUpSummary: (params = {}) => api.get('/leads/followups/summary', { params }),
  triggerReminderSweep: () => api.post('/leads/followups/reminders/run'),
  assignCounsellor: (id, counsellorId, reason) =>
    api.post(`/leads/${id}/assign`, { counsellorId, reason }),
  updateStatus: (id, status) => api.post(`/leads/${id}/status`, { status }),
  scheduleFollowUp: (id, data) => api.post(`/leads/${id}/followup`, data),
  getLeadFollowUps: (id) => api.get(`/leads/${id}/followups`),
  completeFollowUp: (id, followUpId, data) =>
    api.post(`/leads/${id}/followups/${followUpId}/complete`, data),
  addNote: (id, content) => api.post(`/leads/${id}/note`, { content }),
  convertToStudent: (id) => api.post(`/leads/${id}/convert`),
  recalculateScore: (id) => api.post(`/leads/${id}/score`),
  getActivities: (id) => api.get(`/leads/${id}/activities`),
};

// ==================== VISA RULES ====================
export const visaRuleAPI = {
  getAll: (params = {}) => api.get('/visa-applications/rules', { params }),
  create: (data) => api.post('/visa-applications/rules', data),
  getById: (id) => api.get(`/visa-applications/rules/${id}`),
  update: (id, data) => api.put(`/visa-applications/rules/${id}`, data),
  delete: (id) => api.delete(`/visa-applications/rules/${id}`),
  getByCountry: (countryCode) =>
    api.get(`/visa-applications/rules/country/${countryCode}`),
};

// ==================== VISA APPLICATIONS ====================
export const visaAPI = {
  getAll: (params = {}) => api.get('/visa-applications', { params }),
  create: (data) => api.post('/visa-applications', data),
  getById: (id) => api.get(`/visa-applications/${id}`),
  update: (id, data) => api.put(`/visa-applications/${id}`, data),
  delete: (id) => api.delete(`/visa-applications/${id}`),
  getDashboard: () => api.get('/visa-applications/dashboard'),

  // Workflow
  generateWorkflow: (id) =>
    api.post(`/visa-applications/${id}/generate-workflow`),
  updateStage: (id, stage, notes) =>
    api.post(`/visa-applications/${id}/update-stage`, { stage, notes }),
  submit: (id) => api.post(`/visa-applications/${id}/submit`),
  requestAdditionalDocs: (id, data) =>
    api.post(`/visa-applications/${id}/request-additional-docs`, data),
  approve: (id, data) => api.post(`/visa-applications/${id}/approve`, data),
  reject: (id, data) => api.post(`/visa-applications/${id}/reject`, data),
  appeal: (id, appealNotes) =>
    api.post(`/visa-applications/${id}/appeal`, { appealNotes }),
  completePredeparture: (id) =>
    api.post(`/visa-applications/${id}/predeparture-complete`),

  // Checklist
  getChecklist: (id) => api.get(`/visa-applications/${id}/checklist`),
  addChecklistItem: (id, data) =>
    api.post(`/visa-applications/${id}/checklist/item`, data),
  updateChecklistItem: (id, itemId, data) =>
    api.put(`/visa-applications/${id}/checklist/item/${itemId}`, data),
  verifyChecklistItem: (id, itemId) =>
    api.post(`/visa-applications/${id}/checklist/verify/${itemId}`),
  rejectChecklistItem: (id, itemId, reason) =>
    api.post(`/visa-applications/${id}/checklist/reject/${itemId}`, {
      rejectionReason: reason,
    }),

  // Financial
  getFinancial: (id) =>
    api.get(`/visa-applications/${id}/financial-assessment`),
  saveFinancial: (id, data) =>
    api.post(`/visa-applications/${id}/financial-assessment`, data),
  recalculateFinancial: (id) =>
    api.post(`/visa-applications/${id}/financial-assessment/recalculate`),

  // Interview
  scheduleInterview: (id, data) =>
    api.post(`/visa-applications/${id}/interview/schedule`, data),
  completeInterview: (id, data) =>
    api.post(`/visa-applications/${id}/interview/complete`, data),

  // Biometrics
  scheduleBiometrics: (id, data) =>
    api.post(`/visa-applications/${id}/biometrics/schedule`, data),
  completeBiometrics: (id) =>
    api.post(`/visa-applications/${id}/biometrics/complete`),

  // Risk
  runRiskAssessment: (id, data) =>
    api.post(`/visa-applications/${id}/risk-assessment`, data),
};

// ==================== STUDENTS ====================
export const studentAPI = {
  getAllStudents: (page = 1, limit = 10, search = '') =>
    api.get('/students', { params: { page, limit, search } }),
  getStudentById: (id) => api.get(`/students/${id}`),
  createStudent: (data) => api.post('/students', data),
  updateStudent: (id, data) => api.put(`/students/${id}`, data),
  deleteStudent: (id) => api.delete(`/students/${id}`),
  assignCounselor: (id, counselorId) =>
    api.put(`/students/${id}/assign-counselor`, { counselorId }),
  updateStatus: (id, status) => api.patch(`/students/${id}/status`, { status }),
};

// ==================== APPLICANTS ====================
export const applicantAPI = {
  getApplications: () => api.get('/applicants'),
  createApplication: (data) => api.post('/applicants', data),
  updateStatus: (id, status) =>
    api.patch(`/applicants/${id}/status`, { status }),
};

export const applicationAPI = {
  list: (params = {}) => api.get('/applicants', { params }),
  create: (data) => api.post('/applicants', data),
  update: (id, data) => api.patch(`/applicants/${id}/status`, data),
  changeStage: (id, status, notes = '') =>
    api.patch(`/applicants/${id}/status`, { status, notes }),
};

// ==================== INVOICES ====================
export const invoiceAPI = {
  getInvoices: () => api.get('/invoices'),
  createInvoice: (data) => api.post('/invoices', data),
  updateStatus: (id, status, paymentMethod) =>
    api.patch(`/invoices/${id}/status`, { status, paymentMethod }),
  sendEmail: (id) => api.post(`/invoices/${id}/send-email`),
};

// ==================== DASHBOARD ====================
export const dashboardAPI = {
  getDashboardStats: (params = {}) => api.get('/dashboard/stats', { params }),
};

export const followUpAPI = {
  due: (params = {}) => api.get('/leads/followups/due', { params }),
  list: (params = {}) => api.get('/leads/followups', { params }),
  summary: (params = {}) => api.get('/leads/followups/summary', { params }),
  schedule: (leadId, data) => api.post(`/leads/${leadId}/followup`, data),
  complete: (leadId, followUpId, data) =>
    api.post(`/leads/${leadId}/followups/${followUpId}/complete`, data),
  runReminders: () => api.post('/leads/followups/reminders/run'),
};

export const organizationAPI = {
  getSummary: () => api.get('/organization/summary'),
  getRoles: () => api.get('/organization/roles'),
  saveRole: (data) => api.post('/organization/roles', data),
  getPermissionBundles: () => api.get('/organization/permission-bundles'),
  savePermissionBundle: (data) => api.post('/organization/permission-bundles', data),
  updateUserAccess: (id, data) => api.patch(`/organization/users/${id}`, data),
  getAuditLogs: (params = {}) => api.get('/organization/audit-logs', { params }),
  getSlaConfig: () => api.get('/organization/sla'),
  updateSlaConfig: (data) => api.put('/organization/sla', data),
  getCountryWorkflows: () => api.get('/organization/workflows'),
  saveCountryWorkflow: (data) => api.post('/organization/workflows', data),
  getSubscription: () => api.get('/organization/subscription'),
  updateSubscription: (data) => api.put('/organization/subscription', data),
};

export const catalogAPI = {
  getUniversities: (params = {}) => api.get('/catalog/universities', { params }),
  createUniversity: (data) => api.post('/catalog/universities', data),
  updateUniversity: (id, data) => api.put(`/catalog/universities/${id}`, data),
  getCourses: (params = {}) => api.get('/catalog/courses', { params }),
  createCourse: (data) => api.post('/catalog/courses', data),
  updateCourse: (id, data) => api.put(`/catalog/courses/${id}`, data),
  previewImport: (data) => api.post('/catalog/imports/preview', data),
  executeImport: (data) => api.post('/catalog/imports/execute', data),
  getImportLogs: (params = {}) => api.get('/catalog/imports/logs', { params }),
};

export const transferAPI = {
  getTransfers: (params = {}) => api.get('/transfers', { params }),
  createTransfer: (data) => api.post('/transfers', data),
  approveTransfer: (id, data = {}) => api.post(`/transfers/${id}/approve`, data),
  rejectTransfer: (id, data = {}) => api.post(`/transfers/${id}/reject`, data),
  cancelTransfer: (id, data = {}) => api.post(`/transfers/${id}/cancel`, data),
};

export const commissionAPI = {
  getCommissions: (params = {}) => api.get('/commissions', { params }),
  createCommission: (data) => api.post('/commissions', data),
  updateCommissionStatus: (id, data) => api.patch(`/commissions/${id}/status`, data),
};

export const notificationAPI = {
  getNotifications: (params = {}) => api.get('/notifications', { params }),
  markRead: (id) => api.post(`/notifications/${id}/read`),
  markAllRead: () => api.post('/notifications/read-all'),
};

export const reportAPI = {
  getSummary: (params = {}) => api.get('/reports/summary', { params }),
};

export const superAdminAPI = {
  getOverview: () => api.get('/super-admin/overview'),
  listTenants: (params = {}) => api.get('/super-admin/tenants', { params }),
  getTenantDetail: (id) => api.get(`/super-admin/tenants/${id}`),
  createTenant: (data) => api.post('/super-admin/tenants', data),
  updateTenantStatus: (id, data) => api.patch(`/super-admin/tenants/${id}/status`, data),
  updateTenantSubscription: (id, data) =>
    api.put(`/super-admin/tenants/${id}/subscription`, data),
  impersonateTenant: (id) => api.post(`/super-admin/tenants/${id}/impersonate`),
  getTemplates: () => api.get('/super-admin/templates'),
  saveTemplate: (data) => api.post('/super-admin/templates', data),
  applyTemplate: (id, templateKey) =>
    api.post(`/super-admin/tenants/${id}/apply-template`, { templateKey }),
  getBillingPlans: () => api.get('/super-admin/billing-plans'),
  saveBillingPlan: (data) => api.post('/super-admin/billing-plans', data),
  getAuditLogs: (params = {}) => api.get('/super-admin/audit-logs', { params }),
};

export const platformAPI = {
  getBranding: (params = {}) => api.get('/platform/branding', { params }),
  updateBranding: (data) => api.put('/platform/branding', data),
  getIntegrations: (params = {}) => api.get('/platform/integrations', { params }),
  saveIntegration: (data) => api.post('/platform/integrations', data),
  getAutomations: (params = {}) => api.get('/platform/automations', { params }),
  saveAutomation: (data) => api.post('/platform/automations', data),
  getForms: (params = {}) => api.get('/platform/forms', { params }),
  saveForm: (data) => api.post('/platform/forms', data),
  getWebsiteIntegrations: (params = {}) =>
    api.get('/platform/website-integrations', { params }),
  saveWebsiteIntegration: (data) => api.post('/platform/website-integrations', data),
  getQRCodes: (params = {}) => api.get('/platform/qr-codes', { params }),
  createQRCode: (data) => api.post('/platform/qr-codes', data),
  getBillingOverview: (params = {}) => api.get('/platform/billing', { params }),
};

export const formAPI = {
  list: (params = {}) => api.get('/platform/forms', { params }),
  create: (data) => api.post('/platform/forms', data),
  update: (data) => api.post('/platform/forms', data),
  getPublic: (slug) =>
    api.get(`/public/forms/${slug}`, { skipAuthHandling: true }),
  submitPublic: (slug, data) =>
    api.post(`/public/forms/${slug}/submit`, data, { skipAuthHandling: true }),
};

export const qrAPI = {
  list: (params = {}) => api.get('/platform/qr-codes', { params }),
  create: (data) => api.post('/platform/qr-codes', data),
  getPublicLanding: (id) =>
    api.get(`/public/qr/${id}`, { skipAuthHandling: true }),
};

export const websiteIntegrationAPI = {
  list: (params = {}) => api.get('/platform/website-integrations', { params }),
  create: (data) => api.post('/platform/website-integrations', data),
};

export const automationAPI = {
  list: (params = {}) => api.get('/platform/automations', { params }),
  create: (data) => api.post('/platform/automations', data),
  update: (data) => api.post('/platform/automations', data),
};

export const billingAPI = {
  getOverview: (params = {}) => api.get('/platform/billing', { params }),
  getTenantSubscription: () => api.get('/organization/subscription'),
  updateTenantSubscription: (data) => api.put('/organization/subscription', data),
};

export const tenantAPI = {
  getDashboard: () => api.get('/super-admin/overview'),
  list: (params = {}) => api.get('/super-admin/tenants', { params }),
  getById: (id) => api.get(`/super-admin/tenants/${id}`),
  create: (data) => api.post('/super-admin/tenants', data),
  updateStatus: (id, data) => api.patch(`/super-admin/tenants/${id}/status`, data),
  impersonate: (id) => api.post(`/super-admin/tenants/${id}/impersonate`),
};

export const publicAPI = {
  getBranding: (params = {}) =>
    api.get('/public/branding', { params, skipAuthHandling: true }),
  getForm: (slug) =>
    api.get(`/public/forms/${slug}`, { skipAuthHandling: true }),
  submitForm: (slug, data) =>
    api.post(`/public/forms/${slug}/submit`, data, { skipAuthHandling: true }),
  getQRCodeLanding: (id) =>
    api.get(`/public/qr/${id}`, { skipAuthHandling: true }),
};

// ==================== CHAT ====================
export const chatAPI = {
  getUsers: (search = '') =>
    api.get('/chat/users', { params: search ? { search } : {} }),
  getConversations: (search = '') =>
    api.get('/chat/conversations', { params: search ? { search } : {} }),
  getMessages: (conversationId, params = {}) =>
    api.get(`/chat/conversations/${conversationId}/messages`, { params }),
  createConversation: (participantId) =>
    api.post('/chat/conversations', { participantId }),
  sendMessage: (payload) => api.post('/chat/messages', payload),
  markSeen: (conversationId) =>
    api.post(`/chat/conversations/${conversationId}/seen`),
  markDelivered: (conversationId) =>
    api.post(`/chat/conversations/${conversationId}/delivered`),
  search: (query) => api.get('/chat/search', { params: { q: query } }),
};

// ==================== COMPANY ====================
export const companyAPI = {
  getProfile: () => api.get('/company/profile'),
  updateProfile: (data) => api.patch('/company/profile', data),
  getBranding: () => api.get('/company/profile'),
  updateSettings: (data) => api.patch('/company/profile', data),
};

export const branchAPI = {
  getBranches: () => api.get('/branches'),
};

export const agentAPI = {
  getAgents: () => api.get('/agents'),
  createAgent: (data) => api.post('/agents', data),
  updateAgent: (id, data) => api.put(`/agents/${id}`, data),
  deleteAgent: (id) => api.delete(`/agents/${id}`),
};

export default api;

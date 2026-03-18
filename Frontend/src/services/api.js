import axios from 'axios';

// Supports both Create React App (REACT_APP_) prefix
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
});

// Request interceptor: Attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      if (currentPath !== '/login') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

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
  login: (email, password) => api.post('/auth/login', { email, password }),
  getMe: () => api.get('/auth/me'),
};

// ==================== LEADS (CRM) ====================
export const leadAPI = {
  getLeads: (params = {}) => api.get('/leads', { params }),
  createLead: (data) => api.post('/leads', data),
  getLeadById: (id) => api.get(`/leads/${id}`),
  updateLead: (id, data) => api.put(`/leads/${id}`, data),
  deleteLead: (id) => api.delete(`/leads/${id}`),
  getPipeline: () => api.get('/leads/pipeline'),
  getDueFollowUps: () => api.get('/leads/followups/due'),
  assignCounsellor: (id, counsellorId, reason) =>
    api.post(`/leads/${id}/assign`, { counsellorId, reason }),
  updateStatus: (id, status) => api.post(`/leads/${id}/status`, { status }),
  scheduleFollowUp: (id, data) => api.post(`/leads/${id}/followup`, data),
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
};

// ==================== APPLICANTS ====================
export const applicantAPI = {
  getApplications: () => api.get('/applicants'),
  createApplication: (data) => api.post('/applicants', data),
  updateStatus: (id, status) =>
    api.patch(`/applicants/${id}/status`, { status }),
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
  getDashboardStats: () => api.get('/dashboard/stats'),
};

// ==================== COMPANY ====================
export const companyAPI = {
  getProfile: () => api.get('/company/profile'),
  updateProfile: (data) => api.patch('/company/profile', data),
  getBranding: () => api.get('/company/profile'),
  updateSettings: (data) => api.patch('/company/profile', data),
};

export default api;

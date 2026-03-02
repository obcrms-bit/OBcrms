import axios from 'axios';

// Supports both Create React App (REACT_APP_) prefix
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor: Attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle 401 (expired/invalid token) globally
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
    api.post('/auth/register/company', { companyName, email, password, name, country }),
  register: (name, email, password, role = 'counselor') =>
    api.post('/auth/register', { name, email, password, role }),
  login: (email, password) =>
    api.post('/auth/login', { email, password }),
  getMe: () =>
    api.get('/auth/me'),
};

// ==================== LEADS ====================
export const leadAPI = {
  getLeads: (search = '') => api.get('/leads', { params: { search } }),
  createLead: (leadData) => api.post('/leads', leadData),
  updateLead: (id, leadData) => api.put(`/leads/${id}`, leadData),
  deleteLead: (id) => api.delete(`/leads/${id}`),
  updateStatus: (id, status) => api.patch(`/leads/${id}/status`, { status }),
};

// ==================== STUDENTS ====================
export const studentAPI = {
  getAllStudents: (page = 1, limit = 10, search = '') =>
    api.get('/students', { params: { page, limit, search } }),
  getStudentById: (id) =>
    api.get(`/students/${id}`),
  createStudent: (studentData) =>
    api.post('/students', studentData),
  updateStudent: (id, studentData) =>
    api.put(`/students/${id}`, studentData),
  deleteStudent: (id) =>
    api.delete(`/students/${id}`),
  updateStatus: (id, status) =>
    api.patch(`/students/${id}/status`, { status }),
};

// ==================== APPLICANTS (University Applications) ====================
export const applicantAPI = {
  getApplications: () => api.get('/applicants'),
  createApplication: (data) => api.post('/applicants', data),
  updateStatus: (id, status) => api.patch(`/applicants/${id}/status`, { status }),
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

// ==================== COMPANY / BRANDING ====================
export const companyAPI = {
  getProfile: () => api.get('/company/profile'),
  updateProfile: (data) => api.patch('/company/profile', data),
  getBranding: () => api.get('/company/profile'),
  updateSettings: (data) => api.patch('/company/profile', data),
};

export default api;

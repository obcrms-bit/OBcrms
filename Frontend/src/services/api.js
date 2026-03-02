import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include JWT token
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

// Auth endpoints
export const authAPI = {
  registerCompany: (companyName, email, password, name, country) =>
    api.post('/auth/register/company', { companyName, email, password, name, country }),
  register: (name, email, password, role = 'counselor') =>
    api.post('/auth/register', { name, email, password, role }),
  login: (email, password) =>
    api.post('/auth/login', { email, password }),
};

// Lead endpoints
export const leadAPI = {
  getLeads: () => api.get('/leads'),
  createLead: (leadData) => api.post('/leads', leadData),
  updateStatus: (id, status) => api.patch(`/leads/${id}/status`, { status }),
};

// Student endpoints
export const studentAPI = {
  getAllStudents: (page = 1, limit = 10, search = '') =>
    api.get('/students', {
      params: { page, limit, search },
    }),
  getStudentById: (id) =>
    api.get(`/students/${id}`),
  updateStatus: (id, status) =>
    api.patch(`/students/${id}/status`, { status }),
};

// Applicant (University Application) endpoints
export const applicantAPI = {
  getApplications: () => api.get('/applicants'),
  createApplication: (data) => api.post('/applicants', data),
  updateStatus: (id, status) => api.patch(`/applicants/${id}/status`, { status }),
};


// Invoice endpoints
export const invoiceAPI = {
  getInvoices: () => api.get('/invoices'),
  createInvoice: (data) => api.post('/invoices', data),
  updateStatus: (id, status, paymentMethod) => api.patch(`/invoices/${id}/status`, { status, paymentMethod }),
  sendEmail: (id) => api.post(`/invoices/${id}/send-email`),
};

// Dashboard endpoints
export const dashboardAPI = {
  getDashboardStats: () =>
    api.get('/dashboard/stats'),
};

// Company branding and settings
export const companyAPI = {
  getProfile: () => api.get('/company/profile'),
  updateProfile: (data) => api.patch('/company/profile', data),
};

export default api;


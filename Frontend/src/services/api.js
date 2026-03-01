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
  register: (name, email, password, role = 'counselor') =>
    api.post('/auth/register', { name, email, password, role }),
  login: (email, password) =>
    api.post('/auth/login', { email, password }),
};

// Student endpoints
export const studentAPI = {
  getAllStudents: (page = 1, limit = 10, search = '') =>
    api.get('/students', {
      params: { page, limit, search },
    }),
  getStudentById: (id) =>
    api.get(`/students/${id}`),
  createStudent: (studentData) =>
    api.post('/students', studentData),
  updateStudent: (id, studentData) =>
    api.put(`/students/${id}`, studentData),
  deleteStudent: (id) =>
    api.delete(`/students/${id}`),
  assignCounselor: (studentId, counselorId) =>
    api.put(`/students/${studentId}/assign-counselor`, { counselorId }),
};

// Dashboard endpoints
export const dashboardAPI = {
  getDashboardStats: () =>
    api.get('/dashboard/stats'),
};

export default api;

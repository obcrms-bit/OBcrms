import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './components/Layout/DashboardLayout';
import DashboardPage from './pages/DashboardPage';
import './styles/globals.css';
import './App.css';

// Protected route wrapper
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading flex items-center justify-center h-screen bg-white">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

  if (requiredRole && user.role !== 'admin' && !roles.includes(user.role)) {
    return <Navigate to="/login" />;
  }

  return children;
};


import LeadsPage from './pages/LeadsPage';
import StudentsPage from './pages/StudentsPage';
import ApplicantsPage from './pages/ApplicantsPage';
import InvoicesPage from './pages/InvoicesPage';
import SettingsPage from './pages/SettingsPage';

function AppContent() {
  const { user } = useAuth();

  return (
    <Router>
      <div className="app w-full h-full">
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="leads" element={<LeadsPage />} />
            <Route path="students" element={<StudentsPage />} />
            <Route path="applicants" element={<ApplicantsPage />} />
            <Route path="invoices" element={<InvoicesPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Counselor Routes */}
          <Route
            path="/counselor"
            element={
              <ProtectedRoute requiredRole="counselor">
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="leads" element={<LeadsPage />} />
            <Route path="students" element={<StudentsPage />} />
            <Route path="applicants" element={<ApplicantsPage />} />
          </Route>

          {/* Sales Routes */}
          <Route
            path="/sales"
            element={
              <ProtectedRoute requiredRole="sales">
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="leads" element={<LeadsPage />} />
            <Route path="students" element={<StudentsPage />} />
          </Route>

          {/* Accountant Routes */}
          <Route
            path="/accountant"
            element={
              <ProtectedRoute requiredRole="accountant">
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="invoices" element={<InvoicesPage />} />
          </Route>

          {/* Manager Routes */}
          <Route
            path="/manager"
            element={
              <ProtectedRoute requiredRole="manager">
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="leads" element={<LeadsPage />} />
            <Route path="students" element={<StudentsPage />} />
            <Route path="applicants" element={<ApplicantsPage />} />
            <Route path="invoices" element={<InvoicesPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          <Route
            path="/"
            element={
              user ? (
                <Navigate to={`/${user.role}`} />
              ) : (
                <Navigate to="/login" />
              )
            }
          />

        </Routes>
      </div>
    </Router>
  );
}

import { BrandingProvider } from './context/BrandingContext';

function App() {
  return (
    <AuthProvider>
      <BrandingProvider>
        <AppContent />
      </BrandingProvider>
    </AuthProvider>
  );
}

export default App;

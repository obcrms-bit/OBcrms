import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BrandingProvider } from './context/BrandingContext';

// Pages
import LoginPage from './pages/LoginPage';
import LeadsPage from './pages/LeadsPage';
import StudentsPage from './pages/StudentsPage';
import ApplicantsPage from './pages/ApplicantsPage';
import InvoicesPage from './pages/InvoicesPage';
import SettingsPage from './pages/SettingsPage';
import DashboardPage from './pages/DashboardPage';

// Layout
import DashboardLayout from './components/Layout/DashboardLayout';

// Styles
import './styles/globals.css';
import './App.css';

// Protected route wrapper — redirects to /login if not authenticated or wrong role
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f9fafb' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '4px solid #e5e7eb', borderTop: '4px solid #667eea', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ color: '#6b7280', fontSize: 14 }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    // super_admin can access any route
    if (user.role !== 'super_admin' && !roles.includes(user.role)) {
      return <Navigate to="/login" replace />;
    }
  }

  return children;
};

function AppContent() {
  const { user } = useAuth();

  return (
    <Router>
      <div className="app w-full h-full">
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole={['admin', 'super_admin']}>
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

          {/* Default: redirect based on role, or to login */}
          <Route
            path="/"
            element={
              user ? (
                <Navigate to={`/${user.role === 'super_admin' ? 'admin' : user.role}`} replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* Catch-all 404 */}
          <Route
            path="*"
            element={
              user ? (
                <Navigate to={`/${user.role === 'super_admin' ? 'admin' : user.role}`} replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

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

import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BrandingProvider } from './context/BrandingContext';

// Pages — Core
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import StudentsPage from './pages/StudentsPage';
import ApplicantsPage from './pages/ApplicantsPage';
import InvoicesPage from './pages/InvoicesPage';
import SettingsPage from './pages/SettingsPage';

// Pages — CRM (Leads)
import LeadsPage from './pages/LeadsPage';
import LeadCreatePage from './pages/LeadCreatePage';
import LeadDetailPage from './pages/LeadDetailPage';
import PipelineBoardPage from './pages/PipelineBoardPage';

// Pages — Visa
import VisaApplicationsPage from './pages/VisaApplicationsPage';
import VisaCreatePage from './pages/VisaCreatePage';
import VisaDetailPage from './pages/VisaDetailPage';

// Layout
import DashboardLayout from './components/Layout/DashboardLayout';

// Styles
import './styles/globals.css';
import './App.css';

// ─── Protected Route ────────────────────────────────────────────────────────
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: '#f9fafb',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 40,
              height: 40,
              border: '4px solid #e5e7eb',
              borderTop: '4px solid #6366f1',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 12px',
            }}
          />
          <p style={{ color: '#6b7280', fontSize: 14 }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (user.role !== 'super_admin' && !roles.includes(user.role)) {
      return <Navigate to="/login" replace />;
    }
  }

  return children;
};

// ─── Route Helper ─────────────────────────────────────────────────────────────
const AdminRoutes = () => (
  <>
    <Route index element={<DashboardPage />} />

    {/* CRM */}
    <Route path="leads" element={<LeadsPage />} />
    <Route path="leads/create" element={<LeadCreatePage />} />
    <Route path="leads/pipeline" element={<PipelineBoardPage />} />
    <Route path="leads/:id" element={<LeadDetailPage />} />

    {/* Visa */}
    <Route path="visa" element={<VisaApplicationsPage />} />
    <Route path="visa/create" element={<VisaCreatePage />} />
    <Route path="visa/:id" element={<VisaDetailPage />} />

    {/* Other */}
    <Route path="students" element={<StudentsPage />} />
    <Route path="applicants" element={<ApplicantsPage />} />
    <Route path="invoices" element={<InvoicesPage />} />
    <Route path="settings" element={<SettingsPage />} />
  </>
);

function AppContent() {
  const { user } = useAuth();

  return (
    <Router>
      <div className="app w-full h-full">
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Admin / Super Admin */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole={['admin', 'super_admin']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <AdminRoutes />
          </Route>

          {/* Counselor */}
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
            <Route path="leads/create" element={<LeadCreatePage />} />
            <Route path="leads/pipeline" element={<PipelineBoardPage />} />
            <Route path="leads/:id" element={<LeadDetailPage />} />
            <Route path="visa" element={<VisaApplicationsPage />} />
            <Route path="visa/create" element={<VisaCreatePage />} />
            <Route path="visa/:id" element={<VisaDetailPage />} />
            <Route path="students" element={<StudentsPage />} />
            <Route path="applicants" element={<ApplicantsPage />} />
          </Route>

          {/* Sales */}
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
            <Route path="leads/create" element={<LeadCreatePage />} />
            <Route path="leads/pipeline" element={<PipelineBoardPage />} />
            <Route path="leads/:id" element={<LeadDetailPage />} />
            <Route path="students" element={<StudentsPage />} />
          </Route>

          {/* Accountant */}
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

          {/* Manager */}
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
            <Route path="leads/create" element={<LeadCreatePage />} />
            <Route path="leads/pipeline" element={<PipelineBoardPage />} />
            <Route path="leads/:id" element={<LeadDetailPage />} />
            <Route path="visa" element={<VisaApplicationsPage />} />
            <Route path="visa/create" element={<VisaCreatePage />} />
            <Route path="visa/:id" element={<VisaDetailPage />} />
            <Route path="students" element={<StudentsPage />} />
            <Route path="applicants" element={<ApplicantsPage />} />
            <Route path="invoices" element={<InvoicesPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Default redirect */}
          <Route
            path="/"
            element={
              user ? (
                <Navigate
                  to={`/${user.role === 'super_admin' ? 'admin' : user.role}`}
                  replace
                />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* 404 catch-all */}
          <Route
            path="*"
            element={
              user ? (
                <Navigate
                  to={`/${user.role === 'super_admin' ? 'admin' : user.role}`}
                  replace
                />
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

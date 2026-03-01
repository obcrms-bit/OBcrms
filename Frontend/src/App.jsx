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

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/login" />;
  }

  return children;
};

function AppContent() {
  const { user } = useAuth();

  return (
    <Router>
      <div className="app w-full h-full">
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* We replace the old AdminDashboard and CounselorDashboard with the new DashboardLayout */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
          </Route>

          <Route
            path="/counselor"
            element={
              <ProtectedRoute requiredRole="counselor">
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
          </Route>

          <Route
            path="/"
            element={
              user ? (
                <Navigate to={user.role === 'admin' ? '/admin' : '/counselor'} />
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

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

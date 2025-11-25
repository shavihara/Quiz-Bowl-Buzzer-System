import React from 'react';
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ConfigProvider } from './context/ConfigContext';
import Login from './pages/Login';
import DashboardLayout from './components/DashboardLayout';
import DashboardHome from './pages/DashboardHome';
import About from './pages/About';
import History from './pages/History';
import Config from './pages/Config';
import MainPresentation from './pages/MainPresentation';
import ConfigurationPage from './pages/ConfigurationPage';
import MainQuizPage from './pages/MainQuizPage';

// Protected Route Wrapper
const ProtectedRoute = ({ children }: React.PropsWithChildren) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      
      {/* New Simplified Routes (Protected) */}
      <Route path="/" element={
        <ProtectedRoute>
          <MainQuizPage />
        </ProtectedRoute>
      } />
      
      <Route path="/config-new" element={
        <ProtectedRoute>
          <ConfigurationPage />
        </ProtectedRoute>
      } />

      {/* Existing Dashboard Routes (Keep for backward compatibility) */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="home" replace />} />
        <Route path="home" element={<DashboardHome />} />
        <Route path="about" element={<About />} />
        <Route path="history" element={<History />} />
      </Route>

      {/* Existing Standalone Pages */}
      <Route path="/config" element={
        <ProtectedRoute>
          <ConfigurationPage />
        </ProtectedRoute>
      } />
      
      <Route path="/main" element={
        <ProtectedRoute>
          <MainQuizPage />
        </ProtectedRoute>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <ConfigProvider>
        <MemoryRouter>
          <AppRoutes />
        </MemoryRouter>
      </ConfigProvider>
    </AuthProvider>
  );
};

export default App;
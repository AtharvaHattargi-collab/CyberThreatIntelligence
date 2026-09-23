import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import Overview from './pages/Overview';
import ThreatMonitor from './pages/ThreatMonitor';
import ThreatAnalytics from './pages/ThreatAnalytics';
import NetworkAnalytics from './pages/NetworkAnalytics';
import SecurityEvents from './pages/SecurityEvents';
import IncidentCenter from './pages/IncidentCenter';
import MLDetection from './pages/MLDetection';
import ModelPerformance from './pages/ModelPerformance';
import DatasetExplorer from './pages/DatasetExplorer';
import ReportCenter from './pages/ReportCenter';
import WorkspaceSettings from './pages/WorkspaceSettings';
import Users from './pages/Users';
import AuditLog from './pages/AuditLog';
import Login from './pages/Login';

import { AppProvider } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div className="h-screen w-screen bg-background flex items-center justify-center text-text-muted">Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<Overview />} />
          <Route path="monitor" element={<ThreatMonitor />} />
          <Route path="threats" element={<ThreatAnalytics />} />
          <Route path="network" element={<NetworkAnalytics />} />
          <Route path="events" element={<SecurityEvents />} />
          <Route path="incidents" element={<IncidentCenter />} />
          <Route path="detection" element={<MLDetection />} />
          <Route path="performance" element={<ModelPerformance />} />
          <Route path="dataset" element={<DatasetExplorer />} />
          <Route path="reports" element={<ReportCenter />} />
          <Route path="settings" element={<WorkspaceSettings />} />
          <Route path="users" element={<Users />} />
          <Route path="audit" element={<AuditLog />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
        </Routes>
        </BrowserRouter>
      </AppProvider>
    </AuthProvider>
  );
}

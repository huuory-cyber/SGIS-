import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute, { AdminRoute, ProviderRoute, AgentRoute } from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import ProviderDashboard from './pages/ProviderDashboard';
import AgentDashboard from './pages/AgentDashboard';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Admin routes */}
          <Route 
            path="/admin/*" 
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } 
          />
          
          {/* Provider routes */}
          <Route 
            path="/provider/*" 
            element={
              <ProviderRoute>
                <ProviderDashboard />
              </ProviderRoute>
            } 
          />
          
          {/* Agent routes */}
          <Route 
            path="/agent/*" 
            element={
              <AgentRoute>
                <AgentDashboard />
              </AgentRoute>
            } 
          />
          
          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Catch all - redirect to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

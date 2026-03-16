import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserProfile } from '../types';
import type { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: Array<'admin' | 'provider' | 'agent'>;
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    if (user.role === 'admin') {
      return <Navigate to="/admin" replace />;
    } else if (user.role === 'provider') {
      return <Navigate to="/provider" replace />;
    } else {
      return <Navigate to="/agent" replace />;
    }
  }

  return <>{children}</>;
}

// Admin only route
export function AdminRoute({ children }: { children: ReactNode }) {
  return <ProtectedRoute allowedRoles={['admin']}>{children}</ProtectedRoute>;
}

// Provider or admin route
export function ProviderRoute({ children }: { children: ReactNode }) {
  return <ProtectedRoute allowedRoles={['admin', 'provider']}>{children}</ProtectedRoute>;
}

// Agent, provider, or admin route
export function AgentRoute({ children }: { children: ReactNode }) {
  return <ProtectedRoute allowedRoles={['admin', 'provider', 'agent']}>{children}</ProtectedRoute>;
}

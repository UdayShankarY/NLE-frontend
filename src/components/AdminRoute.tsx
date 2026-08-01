import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface AdminRouteProps {
  children: ReactNode;
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const auth = useAuth();
  const location = useLocation();

  if (auth.isLoading || !auth.initialized) {
    console.log('AdminRoute waiting for auth:', {
      isLoading: auth.isLoading,
      initialized: auth.initialized,
      authUser: auth.user,
      isAdmin: auth.isAdmin,
    });
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-sm text-ink-muted">
        Verifying admin access...
      </div>
    );
  }

  console.log('AdminRoute current role:', { role: auth.user?.role, isAdmin: auth.isAdmin });

  if (!auth.isLoggedIn || !auth.user) {
    auth.open('login');
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  if (!auth.isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

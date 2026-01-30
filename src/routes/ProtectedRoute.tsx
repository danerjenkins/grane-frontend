import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getSession } from '../api/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * ProtectedRoute component for routes that require authentication.
 * Redirects to /login if user is not authenticated.
 * Used for /account and other customer-only pages.
 * (Note: /admin uses AdminRoute which checks RPC is_admin())
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await getSession();
        setIsAuthenticated(session !== null);
      } catch {
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  // Still loading
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <p className="text-secondary">Loading...</p>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Authenticated - render children
  return <>{children}</>;
}

import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppAuth } from '@client/src/contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: string[];
}

export default function ProtectedRoute({
  children,
  requiredRoles = ['quotation_editor', 'admin', 'super_admin'],
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasAnyRole } = useAppAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
        权限加载中...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!hasAnyRole(requiredRoles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}

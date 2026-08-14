import type { ReactNode } from 'react';
import { useAppAuth } from '@client/src/contexts/AuthContext';

interface SuperAdminOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export default function SuperAdminOnly({
  children,
  fallback = null,
}: SuperAdminOnlyProps) {
  const { hasRole } = useAppAuth();

  if (!hasRole('super_admin')) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

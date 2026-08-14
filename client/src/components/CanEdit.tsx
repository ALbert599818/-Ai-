import type { ReactNode } from 'react';
import { useAppAuth } from '@client/src/contexts/AuthContext';

interface CanEditProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export default function CanEdit({ children, fallback = null }: CanEditProps) {
  const { hasAnyRole } = useAppAuth();

  if (!hasAnyRole(['quotation_editor', 'admin', 'super_admin'])) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

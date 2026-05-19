import React, { ReactNode, useEffect } from 'react';
import { UserRole } from '@widyatama/sso-types';
import { useUser } from '../hooks/useUser';
import { useAuth } from '../hooks/useAuth';

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  requiredRoles?: UserRole[];
  requiredAllRoles?: boolean;
  loadingComponent?: ReactNode;
}

/**
 * Component to guard routes or sections based on authentication and roles
 * @example
 * // Basic auth guard
 * <AuthGuard>
 *   <Dashboard />
 * </AuthGuard>
 * 
 * // Role-based guard
 * <AuthGuard requiredRoles={['dosen', 'admin_akademik']}>
 *   <DosenPanel />
 * </AuthGuard>
 * 
 * // Custom fallback
 * <AuthGuard 
 *   requiredRoles={['admin_akademik']}
 *   fallback={<div>Admin access only</div>}
 * >
 *   <AdminPanel />
 * </AuthGuard>
 */
export function AuthGuard({
  children,
  fallback,
  requiredRoles,
  requiredAllRoles = false,
  loadingComponent,
}: AuthGuardProps) {
  const { isAuthenticated, isLoading, login } = useAuth();
  const { hasAnyRole, hasAllRoles, roles } = useUser();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Auto-redirect to login if not authenticated
      login();
    }
  }, [isLoading, isAuthenticated, login]);

  if (isLoading) {
    return <>{loadingComponent || <div>Loading...</div>}</>;
  }

  if (!isAuthenticated) {
    return <>{fallback || <div>Redirecting to login...</div>}</>;
  }

  if (requiredRoles && requiredRoles.length > 0) {
    const hasRequiredRoles = requiredAllRoles
      ? hasAllRoles(requiredRoles)
      : hasAnyRole(requiredRoles);

    if (!hasRequiredRoles) {
      return (
        <>
          {fallback || (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <h2>Access Denied</h2>
              <p>You don't have the required permissions to access this page.</p>
              <p>Your roles: {roles.join(', ') || 'None'}</p>
              <p>Required roles: {requiredRoles.join(', ')}</p>
            </div>
          )}
        </>
      );
    }
  }

  return <>{children}</>;
}

import { useAuthContext } from '../auth/AuthProvider';
import { UserRole } from '@widyatama/sso-types';

/**
 * Hook to access user information and role checks
 * @example
 * function AdminPanel() {
 *   const { user, hasRole } = useUser();
 *   
 *   if (!hasRole('admin_akademik')) {
 *     return <div>Access denied</div>;
 *   }
 *   
 *   return <div>Admin content</div>;
 * }
 */
export function useUser() {
  const { user, isAuthenticated, isLoading } = useAuthContext();

  const hasRole = (role: UserRole): boolean => {
    return user?.roles.includes(role) || false;
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return roles.some((role) => user?.roles.includes(role));
  };

  const hasAllRoles = (roles: UserRole[]): boolean => {
    return roles.every((role) => user?.roles.includes(role));
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    roles: user?.roles || [],
    groups: user?.groups || [],
  };
}

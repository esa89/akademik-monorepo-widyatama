import { useEffect } from 'react';
import { useAuth } from '@widyatama/sso-react';
import { authRef } from '@/services/auth-ref';

/**
 * Invisible component that syncs auth context functions
 * into a module-level ref so axios interceptors can use them.
 */
export function AuthSync() {
  const { getAccessToken, logout } = useAuth();

  useEffect(() => {
    authRef.getAccessToken = getAccessToken;
    authRef.logout = logout;
  }, [getAccessToken, logout]);

  return null;
}

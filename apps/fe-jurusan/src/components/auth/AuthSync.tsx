import { useEffect } from 'react';
import { useAuth } from '@widyatama/sso-react';
import { authRef } from '@/services/auth-ref';

export function AuthSync() {
  const { getAccessToken, logout } = useAuth();

  useEffect(() => {
    authRef.getAccessToken = getAccessToken;
    authRef.logout = logout;
  }, [getAccessToken, logout]);

  return null;
}

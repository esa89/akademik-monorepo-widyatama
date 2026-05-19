'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useMemo } from 'react';
import { SessionUser, UserRole } from '@widyatama/sso-types';

/**
 * Hook for authentication in Next.js client components
 * @example
 * 'use client';
 * 
 * function Header() {
 *   const { user, isAuthenticated, login, logout } = useAuth();
 *   
 *   return (
 *     <header>
 *       {isAuthenticated ? (
 *         <>
 *           <span>Welcome, {user?.name}</span>
 *           <button onClick={logout}>Logout</button>
 *         </>
 *       ) : (
 *         <button onClick={login}>Login</button>
 *       )}
 *     </header>
 *   );
 * }
 */
export function useAuth() {
  const { data: session, status } = useSession();

  const user: SessionUser | null = useMemo(() => {
    if (!session?.user) return null;

    return {
      id: session.user.id || '',
      email: session.user.email || '',
      name: session.user.name || '',
      roles: (session.roles as UserRole[]) || [],
      groups: (session.groups as string[]) || [],
    };
  }, [session]);

  const login = () => {
    signIn('authentik');
  };

  const logout = () => {
    signOut({ callbackUrl: '/' });
  };

  return {
    user,
    session,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
    login,
    logout,
    getAccessToken: () => session?.accessToken as string | undefined,
  };
}

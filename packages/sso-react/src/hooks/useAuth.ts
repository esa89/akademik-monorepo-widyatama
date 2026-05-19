import { useAuthContext, AuthContextType } from '../auth/AuthProvider';

/**
 * Hook to access authentication state and methods
 * @example
 * function Header() {
 *   const { isAuthenticated, user, login, logout } = useAuth();
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
export function useAuth(): AuthContextType {
  return useAuthContext();
}

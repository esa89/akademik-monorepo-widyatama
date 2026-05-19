import { getServerSession } from 'next-auth/next';
import { NextAuthOptions } from 'next-auth';
import { SessionUser, UserRole } from '@widyatama/sso-types';

/**
 * Get session on the server side
 * @example
 * // app/page.tsx (Server Component)
 * import { getServerAuthSession } from '@widyatama/sso-next';
 * import { authOptions } from './api/auth/[...nextauth]/route';
 * 
 * export default async function Page() {
 *   const session = await getServerAuthSession(authOptions);
 *   
 *   if (!session) {
 *     redirect('/login');
 *   }
 *   
 *   return <div>Welcome {session.user?.name}</div>;
 * }
 */
export async function getServerAuthSession(authOptions: NextAuthOptions) {
  return await getServerSession(authOptions);
}

/**
 * Convert NextAuth session to SessionUser
 */
export function sessionToUser(session: any): SessionUser | null {
  if (!session?.user) return null;

  return {
    id: session.user.id || '',
    email: session.user.email || '',
    name: session.user.name || '',
    roles: (session.roles as UserRole[]) || [],
    groups: (session.groups as string[]) || [],
  };
}

/**
 * Check if user has required role (server-side)
 */
export function hasRole(session: any, role: UserRole): boolean {
  const roles = (session?.roles as UserRole[]) || [];
  return roles.includes(role);
}

/**
 * Check if user has any of the required roles (server-side)
 */
export function hasAnyRole(session: any, roles: UserRole[]): boolean {
  const userRoles = (session?.roles as UserRole[]) || [];
  return roles.some((role) => userRoles.includes(role));
}

/**
 * Check if user has all required roles (server-side)
 */
export function hasAllRoles(session: any, roles: UserRole[]): boolean {
  const userRoles = (session?.roles as UserRole[]) || [];
  return roles.every((role) => userRoles.includes(role));
}

import { User } from 'oidc-client-ts';

/**
 * Get the access token from the OIDC user
 */
export function getAccessToken(user: User | null): string | null {
  return user?.access_token || null;
}

/**
 * Get the ID token from the OIDC user
 */
export function getIdToken(user: User | null): string | null {
  return user?.id_token || null;
}

/**
 * Check if the token is expired
 */
export function isTokenExpired(user: User | null): boolean {
  if (!user) return true;
  return !!user.expired;
}

/**
 * Get token expiration time in seconds
 */
export function getTokenExpirationTime(user: User | null): number | null {
  if (!user?.expires_at) return null;
  return Math.floor((user.expires_at * 1000 - Date.now()) / 1000);
}

/**
 * Create Authorization header with Bearer token
 */
export function createAuthHeader(token: string | null): { Authorization: string } | {} {
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

/**
 * Create fetch options with Authorization header
 */
export function createAuthFetchOptions(
  token: string | null,
  options: RequestInit = {}
): RequestInit {
  return {
    ...options,
    headers: {
      ...options.headers,
      ...createAuthHeader(token),
    },
  };
}

/**
 * Parse JWT token payload without verification
 * WARNING: This does not verify the token signature!
 * Only use this for client-side UI decisions, not for security.
 */
export function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

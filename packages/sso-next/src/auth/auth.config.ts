import { NextAuthOptions } from 'next-auth';
import { AuthentikProvider, createDefaultAuthentikProvider } from './authentik.provider';
import { GROUP_ROLE_MAP, UserRole } from '@widyatama/sso-types';

export interface AuthentikAuthConfig {
  clientId: string;
  clientSecret: string;
  issuerUrl?: string;
  nextAuthSecret: string;
  nextAuthUrl: string;
  pages?: {
    signIn?: string;
    error?: string;
  };
}

/**
 * Create NextAuth configuration with Authentik provider
 */
export function createAuthConfig(config: AuthentikAuthConfig): NextAuthOptions {
  const provider = createDefaultAuthentikProvider(
    config.clientId,
    config.clientSecret,
    config.issuerUrl,
  );

  return {
    providers: [provider],
    secret: config.nextAuthSecret,
    pages: config.pages,
    callbacks: {
      async jwt({ token, account, profile }) {
        // Persist the OAuth access_token and groups to the token right after signin
        if (account) {
          token.accessToken = account.access_token;
          token.idToken = account.id_token;
          token.refreshToken = account.refresh_token;
          token.expiresAt = account.expires_at;
        }

        if (profile) {
          const groups = (profile.groups as string[]) || [];
          token.groups = groups;
          
          // Map groups to roles
          const roles = groups
            .map((group) => GROUP_ROLE_MAP[group.toLowerCase()])
            .filter((role): role is UserRole => role !== undefined);
          token.roles = roles;
        }

        return token;
      },
      async session({ session, token }) {
        // Send properties to the client
        session.accessToken = token.accessToken as string;
        session.idToken = token.idToken as string;
        session.groups = token.groups as string[];
        session.roles = token.roles as UserRole[];
        
        if (session.user) {
          session.user.id = token.sub as string;
        }

        return session;
      },
    },
    events: {
      async signOut({ token }) {
        // Optional: Call Authentik's end-session endpoint
        if (token.idToken) {
          const issuerUrl = config.issuerUrl?.replace(/\/$/, '') || 'http://localhost:9000/application/o/widyatama/';
          const endSessionUrl = `${issuerUrl}/end-session/`;
          
          try {
            await fetch(endSessionUrl, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token.idToken}`,
              },
            });
          } catch (error) {
            console.error('Error calling end-session endpoint:', error);
          }
        }
      },
    },
  };
}

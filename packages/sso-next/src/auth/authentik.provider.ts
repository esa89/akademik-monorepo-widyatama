import { OIDCConfig } from 'next-auth/providers';
import { AuthentikConfig, DEFAULT_OIDC_SCOPES } from '@widyatama/sso-types';

/**
 * Create Authentik OIDC provider for NextAuth
 */
export function AuthentikProvider(config: AuthentikConfig): OIDCConfig<any> {
  const issuerUrl = config.issuerUrl.replace(/\/$/, '');

  return {
    id: 'authentik',
    name: 'Authentik',
    type: 'oidc',
    issuer: issuerUrl,
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    authorization: {
      params: {
        scope: config.scopes.join(' '),
      },
    },
    token: `${issuerUrl}/token/`,
    userinfo: `${issuerUrl}/userinfo/`,
    profile(profile) {
      return {
        id: profile.sub,
        name: profile.name || profile.preferred_username,
        email: profile.email,
        image: null,
        groups: profile.groups || [],
        roles: profile.roles || [],
      };
    },
  };
}

/**
 * Default Authentik provider configuration
 */
export function createDefaultAuthentikProvider(
  clientId: string,
  clientSecret: string,
  issuerUrl: string = process.env.AUTHENTIK_ISSUER_URL || 'http://localhost:9000/application/o/widyatama/',
): OIDCConfig<any> {
  return AuthentikProvider({
    issuerUrl,
    clientId,
    clientSecret,
    redirectUri: '', // NextAuth handles this
    scopes: [...DEFAULT_OIDC_SCOPES],
  });
}

import { UserManagerSettings, WebStorageStateStore } from 'oidc-client-ts';
import { AuthentikConfig, DEFAULT_OIDC_SCOPES } from '@widyatama/sso-types';

/**
 * Create OIDC configuration for oidc-client-ts
 */
export function createAuthConfig(config: AuthentikConfig): UserManagerSettings {
  const issuerUrl = config.issuerUrl.replace(/\/$/, '');

  // Auto-detect if PKCE can be used.
  // PKCE requires Crypto.subtle which is only available in secure contexts.
  // localhost is always secure, HTTPS is secure, but HTTP on real domains (e.g. nip.io) is not.
  const isSecureContext =
    typeof window !== 'undefined' &&
    (window.location.protocol === 'https:' || window.location.hostname === 'localhost');

  return {
    authority: issuerUrl,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: config.scopes.join(' '),
    userStore: new WebStorageStateStore({ store: window.localStorage }),
    // Disable PKCE on insecure HTTP non-localhost (e.g. nip.io dev).
    // PKCE requires Crypto.subtle which is only available in secure contexts.
    // metadataSeed merges with discovery results — only overrides the specified field.
    metadataSeed: isSecureContext
      ? undefined
      : { code_challenge_methods_supported: [] },
    // Let oidc-client-ts discover metadata from .well-known/openid-configuration
  };
}

/**
 * Default auth configuration for Widyatama apps
 */
export function createDefaultAuthConfig(
  clientId: string,
  clientSecret: string,
  redirectUri: string,
  issuerUrl?: string,
): UserManagerSettings {
  const finalIssuerUrl = issuerUrl || 'http://localhost:9000/application/o/widyatama/';
  return createAuthConfig({
    issuerUrl: finalIssuerUrl,
    clientId,
    clientSecret,
    redirectUri,
    scopes: [...DEFAULT_OIDC_SCOPES],
  });
}

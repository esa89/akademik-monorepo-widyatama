import { Injectable } from '@nestjs/common';
import { createRemoteJWKSet, jwtVerify, JWTPayload } from 'jose';

export interface JwksValidationOptions {
  issuerUrl: string;
  audience?: string;
  requiredClaims?: string[];
}

/**
 * Service for validating JWT tokens using JWKS from Authentik
 * Uses the 'jose' library which is modern and edge-compatible
 */
@Injectable()
export class JwksService {
  private jwksCache: Map<string, ReturnType<typeof createRemoteJWKSet>> = new Map();

  /**
   * Get or create a JWKS set for the given issuer
   */
  private getJwks(issuerUrl: string): ReturnType<typeof createRemoteJWKSet> {
    const normalizedUrl = issuerUrl.replace(/\/$/, '');
    
    if (!this.jwksCache.has(normalizedUrl)) {
      const jwksUri = new URL(`${normalizedUrl}/jwks/`);
      const jwks = createRemoteJWKSet(jwksUri);
      this.jwksCache.set(normalizedUrl, jwks);
    }

    return this.jwksCache.get(normalizedUrl)!;
  }

  /**
   * Validate a JWT token
   * @param token The JWT token to validate
   * @param options Validation options
   * @returns The decoded payload if valid
   * @throws Error if token is invalid
   */
  async validateToken(
    token: string,
    options: JwksValidationOptions,
  ): Promise<JWTPayload> {
    const jwks = this.getJwks(options.issuerUrl);

    const { payload } = await jwtVerify(token, jwks, {
      issuer: options.issuerUrl,
      audience: options.audience,
    });

    // Check required claims
    if (options.requiredClaims) {
      for (const claim of options.requiredClaims) {
        if (!(claim in payload)) {
          throw new Error(`Required claim '${claim}' not found in token`);
        }
      }
    }

    return payload;
  }

  /**
   * Clear the JWKS cache for a specific issuer or all issuers
   */
  clearCache(issuerUrl?: string): void {
    if (issuerUrl) {
      const normalizedUrl = issuerUrl.replace(/\/$/, '');
      this.jwksCache.delete(normalizedUrl);
    } else {
      this.jwksCache.clear();
    }
  }
}

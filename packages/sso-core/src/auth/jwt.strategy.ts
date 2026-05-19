import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { OIDCTokenClaims, SessionUser, GROUP_ROLE_MAP } from '@widyatama/sso-types';

export interface JwtStrategyOptions {
  issuerUrl: string;
  audience?: string;
}

@Injectable()
export class AuthentikJwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(options: JwtStrategyOptions) {
    const jwksUri = `${options.issuerUrl.replace(/\/$/, '')}/jwks/`;
    
    super({
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri,
      }),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      issuer: options.issuerUrl,
      audience: options.audience,
      algorithms: ['RS256'],
    });
  }

  async validate(payload: OIDCTokenClaims): Promise<SessionUser> {
    // Map Authentik groups to our roles
    const groups = payload.groups || [];
    const roles = groups
      .map((group) => GROUP_ROLE_MAP[group.toLowerCase()])
      .filter((role): role is NonNullable<typeof role> => role !== undefined);

    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      roles,
      groups,
      metadata: {
        preferredUsername: payload.preferred_username,
        givenName: payload.given_name,
        familyName: payload.family_name,
      },
    };
  }
}

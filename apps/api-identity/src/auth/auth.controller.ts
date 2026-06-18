import { Controller, Get, Post, Body, Query, Res, Headers } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('health')
  health() {
    return { status: 'ok', service: 'api-identity' };
  }

  @Get('.well-known/openid-configuration')
  oidcConfig() {
    return this.authService.getOidcConfiguration();
  }

  // ─── Authorization redirect ─────────────────────────────────────────────
  // Receives all OIDC params from oidc-client-ts including nonce, forwards to fe-identity

  @Get('authorize')
  authorize(
    @Query('redirect_uri') redirectUri: string,
    @Query('state') state: string,
    @Query('client_id') clientId: string,
    @Query('nonce') nonce: string,
    @Res() res: Response,
  ) {
    const redirectUrl = this.authService.buildAuthorizeRedirect(redirectUri, state, clientId, nonce || '');
    return res.redirect(redirectUrl);
  }

  // ─── Login (used by fe-identity to validate credentials) ────────────────

  @Post('auth/login')
  async login(
    @Body() body: { username: string; password: string; nonce?: string; clientId?: string },
  ) {
    return this.authService.login(
      body.username,
      body.password,
      body.nonce || '',
      body.clientId || 'fe-dosen',
    );
  }

  // ─── Token exchange (used by oidc-client-ts via signinRedirectCallback) ─

  @Post('auth/token')
  async token(
    @Body() body: {
      code: string;
      redirect_uri?: string;
      client_id?: string;
      grant_type?: string;
      code_verifier?: string;
    },
  ) {
    return this.authService.exchangeToken(body.code, body.redirect_uri || '', body.client_id);
  }

  // ─── UserInfo endpoint ──────────────────────────────────────────────────

  @Get('userinfo')
  userinfo(@Headers('authorization') auth: string) {
    return this.authService.getUserInfo(auth);
  }

  // ─── JWKS (RS256 public key for oidc-client-ts token validation) ────────

  @Get('jwks')
  jwks() {
    return this.authService.getJwks();
  }

  // ─── Logout / Revoke ────────────────────────────────────────────────────

  @Get('auth/logout')
  logout(@Query('post_logout_redirect_uri') redirectUri: string, @Res() res: Response) {
    if (redirectUri) return res.redirect(redirectUri);
    return res.json({ message: 'Logged out' });
  }

  @Post('auth/revoke')
  revoke() {
    return { message: 'Token revoked' };
  }

  // ─── Legacy OAuth redirect (keep for compatibility) ──────────────────────

  @Get('auth/oauth')
  oauthRedirect(
    @Query('return_to') returnTo: string,
    @Query('client_id') clientId: string,
    @Res() res: Response,
  ) {
    const feIdentityUrl = this.authService.feIdentityUrl;
    return res.redirect(`${feIdentityUrl}?return_to=${encodeURIComponent(returnTo || '')}&client_id=${clientId}`);
  }
}

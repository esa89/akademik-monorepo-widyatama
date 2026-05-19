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

  @Get('authorize')
  authorize(
    @Query('redirect_uri') redirectUri: string,
    @Query('state') state: string,
    @Query('client_id') clientId: string,
    @Res() res: Response,
  ) {
    const redirectUrl = this.authService.buildAuthorizeRedirect(redirectUri, state, clientId);
    return res.redirect(redirectUrl);
  }

  @Get('auth/oauth')
  oauthRedirect(
    @Query('return_to') returnTo: string,
    @Query('client_id') clientId: string,
    @Res() res: Response,
  ) {
    const feIdentityUrl = this.authService.feIdentityUrl;
    const redirectUrl = `${feIdentityUrl}?return_to=${encodeURIComponent(returnTo || '')}&client_id=${clientId}`;
    return res.redirect(redirectUrl);
  }

  @Post('auth/login')
  async login(@Body() body: { username: string; password: string }) {
    const result = await this.authService.login(body.username, body.password);
    return result;
  }

  @Post('auth/token')
  async token(@Body() body: { code: string; redirect_uri: string }) {
    const result = await this.authService.exchangeToken(body.code, body.redirect_uri);
    return result;
  }

  @Get('userinfo')
  userinfo(@Headers('authorization') auth: string) {
    return this.authService.getUserInfo(auth);
  }

  @Get('jwks')
  jwks() {
    return { keys: [] };
  }

  @Get('auth/logout')
  logout(@Query('post_logout_redirect_uri') redirectUri: string, @Res() res: Response) {
    if (redirectUri) {
      return res.redirect(redirectUri);
    }
    return res.json({ message: 'Logged out' });
  }

  @Post('auth/revoke')
  revoke() {
    return { message: 'Token revoked' };
  }
}

import {
  Injectable, Logger, UnauthorizedException,
  BadRequestException, InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import axios from 'axios';

// ─── Types ─────────────────────────────────────────────────────────────────
interface CodeEntry {
  sub: string;
  email: string;
  name: string;
  username: string;
  groups: string[];
  nonce: string;
  clientId: string;
  accessToken: string;
  createdAt: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  private readonly rsaPrivatePem: string;
  private readonly publicJwk: Record<string, unknown>;

  // One-time-use code → user info
  private readonly codeStore = new Map<string, CodeEntry>();
  // Long-lived access token → user info (for /userinfo)
  private readonly tokenStore = new Map<string, CodeEntry>();

  constructor(private readonly configService: ConfigService) {
    // Generate RSA-2048 key pair at startup for JWT signing
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding:  { type: 'spki',  format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    this.rsaPrivatePem = privateKey as string;
    const pubKeyObj = crypto.createPublicKey(publicKey as string);
    this.publicJwk = pubKeyObj.export({ format: 'jwk' }) as Record<string, unknown>;
    this.logger.log('RSA key pair generated for JWT signing');
  }

  // ─── Config helpers ──────────────────────────────────────────────────────

  private get authentikUrl(): string {
    return this.configService.get<string>('AUTHENTIK_URL', 'http://localhost:9010');
  }

  private get authentikClientId(): string {
    return this.configService.get<string>('AUTHENTIK_CLIENT_ID', 'fe-identity');
  }

  private get authentikClientSecret(): string {
    return this.configService.get<string>('AUTHENTIK_CLIENT_SECRET', '');
  }

  get feIdentityUrl(): string {
    return this.configService.get<string>('FE_IDENTITY_URL', 'http://localhost:5174');
  }

  // ─── OIDC Discovery ──────────────────────────────────────────────────────

  getOidcConfiguration() {
    const issuer = this.configService.get<string>('ISSUER_URL', 'http://localhost:3013');
    return {
      issuer,
      authorization_endpoint:      `${issuer}/authorize`,
      token_endpoint:               `${issuer}/auth/token`,
      userinfo_endpoint:            `${issuer}/userinfo`,
      jwks_uri:                     `${issuer}/jwks`,
      end_session_endpoint:         `${issuer}/auth/logout`,
      revocation_endpoint:          `${issuer}/auth/revoke`,
      response_types_supported:     ['code'],
      subject_types_supported:      ['public'],
      id_token_signing_alg_values_supported: ['RS256'],
      token_endpoint_auth_methods_supported: ['client_secret_post', 'client_secret_basic'],
      scopes_supported:             ['openid', 'profile', 'email', 'offline_access'],
      claims_supported:             ['sub', 'iss', 'aud', 'exp', 'iat', 'nonce', 'email', 'name', 'groups', 'preferred_username'],
      code_challenge_methods_supported: ['S256'],
      grant_types_supported:        ['authorization_code', 'refresh_token'],
    };
  }

  // ─── /authorize redirect ──────────────────────────────────────────────────

  buildAuthorizeRedirect(redirectUri: string, state: string, clientId: string, nonce: string): string {
    const params = new URLSearchParams({ return_to: redirectUri, state, client_id: clientId });
    if (nonce) params.set('nonce', nonce);
    return `${this.feIdentityUrl}?${params.toString()}`;
  }

  // ─── Login (credential validation via Authentik flow executor) ──────────

  async login(username: string, password: string, nonce = '', clientId = 'fe-dosen') {
    if (!username || !password) throw new BadRequestException('Username and password are required');

    try {
      const user = await this.validateViaFlowExecutor(username, password);
      const code = this.issueCode({ ...user, nonce, clientId });
      return { success: true, code };
    } catch (error: any) {
      if (error instanceof UnauthorizedException) throw error;
      this.logger.error('Flow executor error:', error.message);
      throw new InternalServerErrorException('Authentication service unavailable');
    }
  }

  // Validate credentials through Authentik's default-authentication-flow
  // without ROPC — walks the flow stages via HTTP, using session cookies.
  private async validateViaFlowExecutor(username: string, password: string): Promise<{
    sub: string; email: string; name: string; username: string; groups: string[];
  }> {
    const flowUrl = `${this.authentikUrl}/api/v3/flows/executor/default-authentication-flow/`;
    const jsonHeaders = { 'Content-Type': 'application/json', 'Accept': 'application/json' };

    // ── Step 1: Start flow, get session cookie ──────────────────────────
    const step1 = await axios.get(flowUrl, { headers: jsonHeaders, validateStatus: () => true });
    if (step1.data?.component !== 'ak-stage-identification') {
      throw new InternalServerErrorException(`Unexpected initial stage: ${step1.data?.component}`);
    }

    // Extract and carry the session cookie for all subsequent requests
    const rawCookies: string[] = (step1.headers['set-cookie'] as string[]) || [];
    const sessionCookie = rawCookies.map(c => c.split(';')[0]).join('; ');
    const cookieHeaders = { ...jsonHeaders, Cookie: sessionCookie };

    // ── Step 2: Submit username (identification stage) ──────────────────
    const step2 = await axios.post(
      flowUrl,
      { component: 'ak-stage-identification', uid_field: username },
      { headers: cookieHeaders, validateStatus: () => true },
    );

    if (step2.data?.component !== 'ak-stage-password') {
      this.logger.warn(`Identification failed for "${username}": ${JSON.stringify(step2.data?.response_errors)}`);
      throw new UnauthorizedException('Username atau password salah');
    }

    // ── Step 3: Submit password ─────────────────────────────────────────
    const step3 = await axios.post(
      flowUrl,
      { component: 'ak-stage-password', password },
      { headers: cookieHeaders, validateStatus: () => true },
    );

    // Check for password error (wrong password returns us back to password stage with errors)
    const passwordErrors = step3.data?.response_errors?.password;
    if (passwordErrors?.length) {
      this.logger.warn(`Password validation failed for "${username}"`);
      throw new UnauthorizedException('Username atau password salah');
    }

    // If the stage did NOT advance from password (returned same component), treat as error
    if (step3.data?.component === 'ak-stage-identification') {
      throw new UnauthorizedException('Username atau password salah');
    }

    // Any advancement past the password stage means credentials are valid:
    // - xak-flow-redirect  → flow completed (no MFA)
    // - ak-stage-authenticator-validate → flow has MFA stage but password was accepted
    // - any other stage   → flow has more steps but password accepted
    this.logger.log(`Credentials validated for "${username}" (next stage: ${step3.data?.component})`);

    // ── Fetch user info via admin API ───────────────────────────────────
    const adminToken = this.configService.get<string>('AUTHENTIK_ADMIN_TOKEN', '');
    const { data: usersData } = await axios.get(
      `${this.authentikUrl}/api/v3/core/users/?search=${encodeURIComponent(username)}`,
      { headers: { Authorization: `Bearer ${adminToken}` } },
    );

    const user = (usersData.results as any[])?.find(u => u.username === username);
    if (!user) throw new InternalServerErrorException('User validated but not found in Authentik');

    return {
      sub:      String(user.pk),
      email:    user.email || '',
      name:     user.name || user.username,
      username: user.username,
      groups:   (user.groups_obj as any[])?.map(g => g.name) || [],
    };
  }

  // ─── Code store ───────────────────────────────────────────────────────────

  private issueCode(user: Omit<CodeEntry, 'accessToken' | 'createdAt'>): string {
    const code        = crypto.randomUUID();
    const accessToken = crypto.randomUUID();
    const entry: CodeEntry = { ...user, accessToken, createdAt: Date.now() };
    this.codeStore.set(code, entry);
    this.tokenStore.set(accessToken, entry);
    // One-time code expires in 2 minutes
    setTimeout(() => this.codeStore.delete(code), 2 * 60_000);
    return code;
  }

  // ─── Token exchange ───────────────────────────────────────────────────────

  async exchangeToken(code: string, _redirectUri: string, clientId?: string) {
    const entry = this.codeStore.get(code);
    if (entry) {
      this.codeStore.delete(code);
      return {
        access_token:  entry.accessToken,
        refresh_token: crypto.randomUUID(),
        expires_in:    3600,
        token_type:    'Bearer',
        id_token:      this.buildIdToken(entry, clientId || entry.clientId),
      };
    }
    throw new InternalServerErrorException('Authorization code tidak valid atau sudah kadaluarsa');
  }

  // ─── JWT (RS256) ──────────────────────────────────────────────────────────

  private buildIdToken(entry: CodeEntry, clientId: string): string {
    const now = Math.floor(Date.now() / 1000);
    const payload: Record<string, unknown> = {
      iss:                'http://localhost:3013',
      sub:                entry.sub,
      aud:                clientId,
      exp:                now + 3600,
      iat:                now,
      auth_time:          now,
      email:              entry.email,
      email_verified:     true,
      name:               entry.name,
      preferred_username: entry.username,
      nickname:           entry.username,
      groups:             entry.groups,
    };
    if (entry.nonce) payload['nonce'] = entry.nonce;
    return this.signRS256(payload);
  }

  private signRS256(payload: Record<string, unknown>): string {
    const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT', kid: 'dev-key-1' })).toString('base64url');
    const body   = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const data   = `${header}.${body}`;

    const sign = crypto.createSign('RSA-SHA256');
    sign.update(data);
    const sig = sign.sign(this.rsaPrivatePem, 'base64url');

    return `${data}.${sig}`;
  }

  // ─── JWKS ─────────────────────────────────────────────────────────────────

  getJwks() {
    return {
      keys: [{ ...this.publicJwk, kid: 'dev-key-1', use: 'sig', alg: 'RS256' }],
    };
  }

  // ─── UserInfo ─────────────────────────────────────────────────────────────

  getUserInfo(authHeader: string) {
    const token = authHeader?.replace('Bearer ', '');
    const entry = this.tokenStore.get(token);
    if (entry) {
      return {
        sub:                entry.sub,
        email:              entry.email,
        email_verified:     true,
        name:               entry.name,
        preferred_username: entry.username,
        groups:             entry.groups,
      };
    }
    throw new UnauthorizedException('Invalid or expired access token');
  }
}

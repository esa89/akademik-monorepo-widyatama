# Authentik SSO Provider

Authentik is used as the centralized Identity Provider (IdP) for all Widyatama academic portals.

## Quick Start

### 1. Generate secrets
```bash
cd infra/authentik
echo "PG_PASS=$(openssl rand -base64 36 | tr -d '\n')" > .env
echo "AUTHENTIK_SECRET_KEY=$(openssl rand -base64 60 | tr -d '\n')" >> .env
```

### 2. Ensure shared network exists
```bash
docker network create akademik-network 2>/dev/null || true
```

### 3. Start Authentik
```bash
docker compose up -d
```

### 4. Initial Setup
Navigate to http://localhost:9000/if/flow/initial-setup/  
Set the `akadmin` password.

### 5. Post-Setup Configuration
In Authentik Admin UI:

1. **Create Groups** (for role mapping):
   - `dosen`
   - `mahasiswa`
   - `admin_akademik`
   - `kaprodi`

2. **Create an Application** for each frontend:
   - `fe-dosen` → OAuth2/OIDC Provider
   - `fe-akademik` → OAuth2/OIDC Provider
   - `fe-mahasiswa` → OAuth2/OIDC Provider

3. **For each OAuth2 Provider**:
   - Authorization Code flow
   - Redirect URI: `http://localhost:5173/auth/callback` (per app)
   - Note the Client ID and Client Secret

4. **Custom Branding** (System → Brands):
   - Upload Widyatama logo
   - Set custom CSS
   - Set background image

## OIDC Endpoints

| Endpoint | URL |
|----------|-----|
| OpenID Config | `http://localhost:9000/application/o/<app-slug>/.well-known/openid-configuration` |
| Authorization | `http://localhost:9000/application/o/authorize/` |
| Token | `http://localhost:9000/application/o/token/` |
| User Info | `http://localhost:9000/application/o/userinfo/` |
| JWKS | `http://localhost:9000/application/o/<app-slug>/jwks/` |
| End Session | `http://localhost:9000/application/o/<app-slug>/end-session/` |

## Access
- **Authentik Admin**: http://localhost:9000
- **Authentik HTTPS**: https://localhost:9443

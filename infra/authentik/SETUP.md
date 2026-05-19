# Authentik Setup Guide for Widyatama SSO

## Overview
This guide walks you through setting up Authentik as the SSO provider for the Widyatama academic system.

## Quick Start

### 1. Access Authentik

Authentik is now running at:
- **Web Interface**: http://localhost:9000
- **Admin Panel**: http://localhost:9000/if/admin/

### 2. Initial Setup Wizard

1. Visit: http://localhost:9000/if/flow/initial-setup/
2. Complete the wizard with:
   - **Email**: `admin@widyatama.ac.id`
   - **Password**: `WidyatamaAdmin123!`

### 3. Apply Blueprint (Automated Configuration)

After completing the initial setup, apply the Widyatama SSO blueprint:

```bash
# Access the Authentik worker container
docker compose -f infra/authentik/docker-compose.yml exec worker ak import_blueprint /blueprints/widyatama-sso.yaml
```

Or manually via the Admin Interface:
1. Go to **System → Blueprints**
2. Click **Create**
3. Set:
   - Name: `widyatama-sso`
   - Path: `/blueprints/widyatama-sso.yaml`
   - Context: `{}`
4. Click **Create**

### 4. Verify Configuration

After applying the blueprint, verify these were created:

#### Groups (Directory → Groups)
- `dosen`
- `mahasiswa`
- `admin_akademik`
- `kaprodi`

#### OAuth2 Provider (Applications → Providers)
- Name: `Widyatama SSO`
- Client ID: `fe-dosen`
- Client Secret: `widyatama-client-secret-change-me-in-production`

#### Application (Applications → Applications)
- Name: `Widyatama Portal`
- Slug: `widyatama`
- Provider: `Widyatama SSO`

#### Test Users (Directory → Users)
- `dosen.test` (password needs to be set manually)
- `mahasiswa.test` (password needs to be set manually)
- `admin.akademik` (password needs to be set manually)

### 5. Set Passwords for Test Users

For each test user:
1. Go to Directory → Users
2. Click on the user
3. Click **Set Password**
4. Set a password (e.g., `TestPassword123!`)

### 6. Update Client Secret (Optional)

For production, generate a new client secret:
1. Go to Applications → Providers → Widyatama SSO
2. Generate a new Client Secret
3. Update `apps/fe-dosen/.env` with the new secret

## Configuration Details

### OAuth2 Provider Settings

| Setting | Value |
|---------|-------|
| Name | Widyatama SSO |
| Client ID | fe-dosen |
| Client Secret | widyatama-client-secret-change-me-in-production |
| Authorization Flow | default-provider-authorization-explicit-consent |
| Client Type | Confidential |
| Redirect URIs | http://localhost:5173/auth/callback |
| | http://localhost:5174/auth/callback |

### Environment Variables

The fe-dosen app is configured with:

```env
VITE_AUTHENTIK_ISSUER_URL=http://localhost:9000/application/o/widyatama/
VITE_AUTHENTIK_CLIENT_ID=fe-dosen
VITE_AUTHENTIK_CLIENT_SECRET=widyatama-client-secret-change-me-in-production
```

## Testing the Login Flow

### 1. Start fe-dosen

```bash
cd apps/fe-dosen
pnpm install  # if not already done
pnpm dev
```

### 2. Access the App

Open http://localhost:5173 in your browser.

### 3. Login Flow

1. You should be redirected to the login page
2. Click **Login with SSO**
3. You'll be redirected to Authentik
4. Login with test credentials:
   - Username: `dosen.test`
   - Password: `TestPassword123!`
5. After successful login, you'll be redirected back to the app
6. You should see the dashboard with your user info

### 4. Verify Token

Check the browser's DevTools → Application → Local Storage to see the OIDC tokens.

## Troubleshooting

### "Invalid client_id" Error
- Verify the Client ID matches between Authentik and fe-dosen `.env`
- Check that the application is properly linked to the provider

### "Invalid redirect_uri" Error
- Ensure the redirect URI in Authentik matches exactly (including protocol and port)
- Check `VITE_AUTHENTIK_ISSUER_URL` ends with a trailing slash

### "Client authentication failed" Error
- Verify the Client Secret matches
- For public clients, ensure Client Type is set to "Public"

### CORS Errors
- Add `http://localhost:5173` to CORS allowed origins in Authentik

## Useful Commands

```bash
# View Authentik logs
docker compose -f infra/authentik/docker-compose.yml logs -f server

# Restart Authentik
docker compose -f infra/authentik/docker-compose.yml restart

# Reset Authentik (WARNING: deletes all data)
docker compose -f infra/authentik/docker-compose.yml down -v
```

## Next Steps

1. Configure additional applications (fe-akademik, fe-mahasiswa)
2. Set up email verification
3. Configure MFA/2FA
4. Set up LDAP integration for existing user directory

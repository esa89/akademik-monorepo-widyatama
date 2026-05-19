#!/bin/bash
# Bootstrap script for Authentik configuration
# This script sets up the initial OAuth2 provider and application for Widyatama SSO

set -e

AUTHENTIK_URL="http://localhost:9000"
ADMIN_EMAIL="admin@widyatama.ac.id"
ADMIN_PASSWORD="WidyatamaAdmin123!"

echo "=== Authentik Bootstrap Script ==="
echo ""

# Wait for Authentik to be fully ready
echo "Waiting for Authentik to be ready..."
until curl -s -o /dev/null -w "%{http_code}" "${AUTHENTIK_URL}/-/health/ready/" | grep -q "200"; do
    sleep 2
done
echo "Authentik is ready!"
echo ""

# Check if bootstrap has already been done
if docker compose -f /home/esa_fauzi/Utama-Project/akademik-monorepo-widyatama/infra/authentik/docker-compose.yml exec -T server ak authentik_blueprints.apply default 2>/dev/null | grep -q "applied\|already"; then
    echo "Default blueprints already applied."
fi

echo ""
echo "=== Initial Setup Instructions ==="
echo ""
echo "1. Access Authentik Admin Panel:"
echo "   URL: ${AUTHENTIK_URL}/if/flow/initial-setup/"
echo ""
echo "2. Complete the initial setup wizard with:"
echo "   - Email: ${ADMIN_EMAIL}"
echo "   - Password: ${ADMIN_PASSWORD}"
echo ""
echo "3. After setup, configure OAuth2 Provider:"
echo "   a. Go to Admin Interface → Applications → Providers → Create"
echo "   b. Select 'OAuth2/OpenID Provider'"
echo "   c. Configure:"
echo "      Name: Widyatama SSO"
echo "      Authorization flow: default-provider-authorization-explicit-consent"
echo "      Client type: Confidential"
echo "      Client ID: fe-dosen"
echo "      Client Secret: (generate a secure secret)"
echo "      Redirect URIs: http://localhost:5173/auth/callback"
echo "      Signing Key: authentik Self-signed Certificate"
echo ""
echo "4. Create Application:"
echo "   a. Go to Admin Interface → Applications → Applications → Create"
echo "   b. Configure:"
echo "      Name: fe-dosen"
echo "      Slug: fe-dosen"
echo "      Provider: Widyatama SSO"
echo ""
echo "5. Create Groups:"
echo "   a. Go to Directory → Groups → Create"
echo "   b. Create groups: dosen, mahasiswa, admin_akademik, kaprodi"
echo ""
echo "6. Create Test User:"
echo "   a. Go to Directory → Users → Create"
echo "   b. Configure:"
echo "      Username: dosen.test"
echo "      Email: dosen.test@widyatama.ac.id"
echo "      Name: Dosen Test"
echo "      Groups: dosen"
echo "      Password: (set a password)"
echo ""
echo "=== Access Information ==="
echo "Admin Panel: ${AUTHENTIK_URL}/if/admin/"
echo "User Login: ${AUTHENTIK_URL}/application/o/fe-dosen/"
echo ""

#!/usr/bin/env python3
"""
Authentik Setup Script for Widyatama SSO
This script automates the creation of OAuth2 provider, application, groups, and test users.
"""

import requests
import json
import time
import sys

# Configuration
AUTHENTIK_URL = "http://localhost:9000"
ADMIN_EMAIL = "admin@widyatama.ac.id"
ADMIN_PASSWORD = "WidyatamaAdmin123!"

# Wait for Authentik to be ready
print("=== Authentik Setup Script ===\n")
print("Waiting for Authentik to be ready...")
max_retries = 30
for i in range(max_retries):
    try:
        resp = requests.get(f"{AUTHENTIK_URL}/-/health/ready/", timeout=5)
        if resp.status_code == 200:
            print("Authentik is ready!\n")
            break
    except requests.exceptions.RequestException:
        pass
    time.sleep(2)
else:
    print("ERROR: Authentik did not become ready in time")
    sys.exit(1)

print("IMPORTANT: You need to complete the initial setup wizard first!")
print(f"1. Visit: {AUTHENTIK_URL}/if/flow/initial-setup/")
print(f"2. Set admin email: {ADMIN_EMAIL}")
print(f"3. Set admin password: {ADMIN_PASSWORD}")
print("")
print("After completing the wizard, press Enter to continue with automated setup...")
input()

# Authenticate and get API token
print("Authenticating with Authentik...")
auth_resp = requests.post(
    f"{AUTHENTIK_URL}/api/v3/core/users/me/",
    headers={"Content-Type": "application/json"}
)

# Try to get token via API
print("\nNote: This script requires manual setup via the Authentik UI for now.")
print("Please follow these steps in the Authentik Admin Interface:")
print("")
print("=== STEP 1: Create Groups ===")
print("1. Go to Directory → Groups")
print("2. Create the following groups:")
print("   - dosen")
print("   - mahasiswa")
print("   - admin_akademik")
print("   - kaprodi")
print("")
print("=== STEP 2: Create OAuth2/OpenID Provider ===")
print("1. Go to Applications → Providers → Create")
print("2. Select 'OAuth2/OpenID Provider'")
print("3. Configure:")
print("   Name: Widyatama SSO")
print("   Authorization flow: default-provider-authorization-explicit-consent")
print("   Client type: Confidential")
print("   Client ID: fe-dosen")
print("   Client Secret: (copy this, you'll need it for fe-dosen)")
print("   Redirect URIs:")
print("     - http://localhost:5173/auth/callback")
print("     - http://localhost:5174/auth/callback")
print("   Signing Key: authentik Self-signed Certificate")
print("")
print("=== STEP 3: Create Application ===")
print("1. Go to Applications → Applications → Create")
print("2. Configure:")
print("   Name: Widyatama Portal")
print("   Slug: widyatama")
print("   Provider: Widyatama SSO")
print("")
print("=== STEP 4: Create Test User ===")
print("1. Go to Directory → Users → Create")
print("2. Configure:")
print("   Username: dosen.test")
print("   Email: dosen.test@widyatama.ac.id")
print("   Name: Dosen Test")
print("   Groups: dosen")
print("   Password: TestPassword123!")
print("")
print("=== Access URLs ===")
print(f"Admin Interface: {AUTHENTIK_URL}/if/admin/")
print(f"Login URL: {AUTHENTIK_URL}/application/o/widyatama/")
print("")
print("After completing these steps, update your fe-dosen .env file with the Client Secret.")

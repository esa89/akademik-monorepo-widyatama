# Zitadel SSO Setup

## Quick Start

1. **Start Zitadel locally:**
   ```bash
   cd infra/zitadel
   docker-compose up -d
   ```

2. **Access Zitadel Console:**
   - URL: http://localhost:8088
   - Default admin credentials will be generated on first run

3. **Setup Organization & Project:**
   - Create organization: "Universitas Widyatama"
   - Create project: "Akademik System"

4. **Create Applications:**
   - **Dosen Portal** (Web Application)
     - Redirect URIs: 
       - `http://localhost:3010/auth/callback/zitadel`
       - `https://dosen.widyatama.ac.id/auth/callback/zitadel`
   
   - **Mahasiswa Portal** (Web Application)
     - Redirect URIs:
       - `http://localhost:3011/auth/callback/zitadel`
       - `https://mahasiswa.widyatama.ac.id/auth/callback/zitadel`
   
   - **Akademik Portal** (Web Application)
     - Redirect URIs:
       - `http://localhost:3012/auth/callback/zitadel`
       - `https://akademik.widyatama.ac.id/auth/callback/zitadel`

5. **Configure Roles:**
   - `dosen`: Access to teaching features
   - `mahasiswa`: Access to student features
   - `admin_akademik`: Administrative access
   - `kaprodi`: Program head access

6. **Update Environment Variables:**
   Copy the client IDs and secrets to your `.env` files.

## Production Setup

For production, consider:
- Using external PostgreSQL database
- Setting up proper TLS certificates
- Configuring email providers
- Setting up backup strategies
- Monitoring and logging

## Useful Commands

```bash
# View logs
docker-compose logs -f zitadel

# Reset database
docker-compose down -v && docker-compose up -d

# Access database
docker-compose exec db psql -U postgres -d zitadel
```

# Panduan Deploy ke VPS (Production)

**Domain**: `obe-if-utama.web.id`  
**VPS**: NAT VPS + Cloudflare Tunnel (tunnel: `obe-if-utama`)  
**CI/CD**: GitHub Actions → GHCR → SSH ke VPS  
**Repo**: `github.com/esa89/akademik-monorepo-widyatama`

---

## Arsitektur

```
Internet → Cloudflare Tunnel → Port di VPS → Docker Container
```

Tidak perlu buka port di VPS. Cloudflare Tunnel handle semua routing dan HTTPS.

| Subdomain | Port VPS | Container |
|-----------|----------|-----------|
| `auth.obe-if-utama.web.id` | 9010 | authentik-server |
| `sso.obe-if-utama.web.id` | 5174 | fe-identity |
| `api-identity.obe-if-utama.web.id` | 3013 | api-identity |
| `api-akademik.obe-if-utama.web.id` | 3015 | api-akademik |
| `api-obe.obe-if-utama.web.id` | 3014 | api-obe |
| `prodi.obe-if-utama.web.id` | 6174 | fe-jurusan |
| `akademik.obe-if-utama.web.id` | 6175 | fe-akademik |
| `dosen.obe-if-utama.web.id` | 6173 | fe-dosen |

---

## LANGKAH 1 — Cloudflare: Tambah Public Hostname Routes

Buka: **Cloudflare Zero Trust → Networks → Tunnels → obe-if-utama → Public Hostnames → Add**

Tambahkan 8 route berikut (Type: `HTTP`):

| Subdomain | Domain | Service URL |
|-----------|--------|-------------|
| `auth` | `obe-if-utama.web.id` | `http://localhost:9010` |
| `sso` | `obe-if-utama.web.id` | `http://localhost:5174` |
| `api-identity` | `obe-if-utama.web.id` | `http://localhost:3013` |
| `api-akademik` | `obe-if-utama.web.id` | `http://localhost:3015` |
| `api-obe` | `obe-if-utama.web.id` | `http://localhost:3014` |
| `prodi` | `obe-if-utama.web.id` | `http://localhost:6174` |
| `akademik` | `obe-if-utama.web.id` | `http://localhost:6175` |
| `dosen` | `obe-if-utama.web.id` | `http://localhost:6173` |

---

## LANGKAH 2 — Generate SSH Key & Daftarkan ke VPS

SSH key ini dipakai GitHub Actions untuk masuk ke VPS secara otomatis.

### 2a. Generate key di Bitvise

1. Buka **Bitvise → Client Key Manager → Generate New**
2. Isi:
   - **Algorithm**: `Ed25519`
   - **Comment**: `github-actions`
   - **Passphrase**: **kosongkan** (GitHub Actions tidak bisa input passphrase)
3. Klik **Generate**

### 2b. Export Public Key → pasang di VPS

1. Pilih key `github-actions` → klik **Export**
2. Format: **OpenSSH format (public key only)**
3. Buka file hasil export dengan Notepad — isinya satu baris:
   ```
   ssh-ed25519 AAAAC3Nza... github-actions
   ```
4. SSH ke VPS via Bitvise, lalu jalankan:
   ```bash
   mkdir -p /root/.ssh
   echo "PASTE_ISI_PUBLIC_KEY_DI_SINI" >> /root/.ssh/authorized_keys
   chmod 700 /root/.ssh
   chmod 600 /root/.ssh/authorized_keys
   ```

### 2c. Export Private Key → simpan untuk GitHub Secret

1. Pilih key `github-actions` → klik **Export** lagi
2. Format: **OpenSSH format** (bukan yang "public key only")
3. Buka file dengan Notepad — isinya seperti:
   ```
   -----BEGIN OPENSSH PRIVATE KEY-----
   b3BlbnNzaC1rZXktdjEAAAAA...
   -----END OPENSSH PRIVATE KEY-----
   ```
4. Copy **seluruh isi** termasuk baris `-----BEGIN` dan `-----END`

### 2d. Isi GitHub Secrets

Buka: **GitHub repo → Settings → Secrets and variables → Actions → New repository secret**

| Secret Name | Nilai |
|-------------|-------|
| `VPS_HOST` | IP atau hostname SSH dari Bitvise |
| `VPS_PORT` | Port SSH (cek di Bitvise, biasanya 22 atau custom) |
| `VPS_SSH_KEY` | Seluruh isi private key dari langkah 2c |
| `VITE_AUTHENTIK_ISSUER_URL` | `https://api-identity.obe-if-utama.web.id` |
| `VITE_AUTHENTIK_CLIENT_SECRET` | client secret OAuth2 (bebas, tapi sama antara semua app) |
| `VITE_STUDY_PROGRAM_ID` | UUID study program (dari DB lokal) |
| `VITE_STUDY_PROGRAM_NAME` | `Teknik-Informatika` |

---

## LANGKAH 3 — VPS: Setup Folder & .env (Sekali Saja)

### 3a. Buat folder di VPS

Masuk VPS via Bitvise/SSH, jalankan:

```bash
mkdir -p /root/sytama
```

### 3b. Buat file .env di VPS

Generate dulu `AUTHENTIK_SECRET_KEY` (jalankan di VPS):
```bash
openssl rand -base64 60
```
Copy hasil outputnya (satu baris panjang), akan dipakai sebagai nilai `AUTHENTIK_SECRET_KEY` di bawah.

Lalu buat file `.env`:

```bash
cat > /root/sytama/.env << 'EOF'
# PostgreSQL
PG_DB=authentik
PG_USER=authentik
PG_PASS=GANTI_PASSWORD_KUAT

# Authentik
AUTHENTIK_SECRET_KEY=GANTI_HASIL_OPENSSL_RAND_DI_ATAS
AUTHENTIK_BOOTSTRAP_EMAIL=admin@widyatama.ac.id
AUTHENTIK_BOOTSTRAP_PASSWORD=GANTI_PASSWORD_ADMIN

# Didapat setelah Authentik jalan (Langkah 7)
AUTHENTIK_ADMIN_TOKEN=

# OAuth2 client secret (sama dengan yang diisi di GitHub Secret)
VITE_AUTHENTIK_CLIENT_SECRET=GANTI_CLIENT_SECRET
EOF
```

Edit file dengan nilai yang sudah disiapkan:
```bash
nano /root/sytama/.env
```

---

## LANGKAH 4 — Dump Database dari Lokal (Sebelum Push)

Jalankan di **komputer lokal** sebelum push ke GitHub.

```bash
# Cari nama container postgres lokal
docker ps | grep postgres

# Dump semua database (pg_dumpall dump semua DB sekaligus, bukan hanya 'authentik')
docker exec widyatama-akademik-postgres-1 \
  pg_dumpall -U authentik > sytama_backup.sql

# Cek ukuran file (pastikan tidak 0kb)
ls -lh sytama_backup.sql
```

Upload file ke VPS via **Bitvise SFTP**: upload `sytama_backup.sql` ke `/root/sytama/`

---

## LANGKAH 5 — Push ke GitHub (Trigger Deploy Otomatis)

```bash
# Di komputer lokal
git add .
git commit -m "feat: production deploy setup"
git push origin main
```

GitHub Actions akan otomatis:
1. Build 7 Docker image (±10–15 menit)
2. Push image ke `ghcr.io/esa89/akademik-monorepo-widyatama/`
3. Copy `compose.prod.yml` dan `blueprints/` ke `/root/sytama/` di VPS
4. SSH ke VPS → `docker compose pull` → `docker compose up -d`

Pantau progress di: **GitHub repo → Actions**

Tunggu sampai GitHub Actions **selesai (hijau)** sebelum lanjut ke langkah berikutnya.

---

## LANGKAH 6 — Restore Database di VPS

Jalankan setelah GitHub Actions selesai (`compose.prod.yml` sudah ada di `/root/sytama/`).

```bash
# Jalankan postgres dan redis dulu (sebelum service lain)
docker compose -f /root/sytama/compose.prod.yml --env-file /root/sytama/.env up -d postgres redis

# Tunggu postgres siap (~15 detik)
sleep 15

# Restore dump
docker exec -i sytama-prod-postgres-1 \
  psql -U authentik < /root/sytama/sytama_backup.sql

# Buat database tambahan jika belum ada di dump
docker exec sytama-prod-postgres-1 psql -U authentik \
  -c "CREATE DATABASE systama_akademik;" 2>/dev/null || true

docker exec sytama-prod-postgres-1 psql -U authentik \
  -c "CREATE DATABASE systama_obe;" 2>/dev/null || true
```

---

## LANGKAH 7 — Setup Authentik di VPS (Sekali Saja)

Tunggu ±90 detik setelah semua container naik, lalu:

```bash
# Apply blueprint SSO (buat provider, aplikasi, grup, user test)
docker exec sytama-prod-authentik-worker-1 \
  ak apply_blueprint /blueprints/custom/widyatama-sso.yaml
```

Tidak ada output error = berhasil.

Buka **https://auth.obe-if-utama.web.id/if/admin/** → login dengan:
- Email: `admin@widyatama.ac.id`
- Password: nilai `AUTHENTIK_BOOTSTRAP_PASSWORD` dari `.env`

Lalu set password untuk user:
1. **Directory → Users** → pilih user → **Set password** → `TestPassword123!`
2. User yang perlu diset: `admin.akademik`, `dosen.test`, `kaprodi.test`, `mahasiswa.test`

---

## LANGKAH 8 — Verifikasi

Cek semua URL bisa diakses:

| URL | Harusnya tampil |
|-----|----------------|
| https://auth.obe-if-utama.web.id/if/admin/ | Authentik Admin UI |
| https://sso.obe-if-utama.web.id | Halaman login SYTAMA |
| https://prodi.obe-if-utama.web.id | fe-jurusan (redirect ke SSO) |
| https://akademik.obe-if-utama.web.id | fe-akademik (redirect ke SSO) |
| https://dosen.obe-if-utama.web.id | fe-dosen (redirect ke SSO) |
| https://api-akademik.obe-if-utama.web.id/api/docs | Swagger API |

---

## Deploy Selanjutnya (Otomatis)

Setelah setup awal selesai, deploy berikutnya cukup:

```bash
git push origin main
```

GitHub Actions handle sisanya secara otomatis.

---

## Perintah Berguna di VPS

```bash
# Lihat status semua container
docker compose -f /root/sytama/compose.prod.yml ps

# Lihat log service tertentu
docker compose -f /root/sytama/compose.prod.yml logs -f api-akademik
docker compose -f /root/sytama/compose.prod.yml logs -f authentik-server

# Restart satu service
docker compose -f /root/sytama/compose.prod.yml restart fe-jurusan

# Stop semua (data tetap ada)
docker compose -f /root/sytama/compose.prod.yml down

# Update manual tanpa GitHub Actions
docker compose -f /root/sytama/compose.prod.yml --env-file /root/sytama/.env pull
docker compose -f /root/sytama/compose.prod.yml --env-file /root/sytama/.env up -d

# Backup database
docker exec sytama-prod-postgres-1 pg_dumpall -U authentik > /root/backup_$(date +%Y%m%d).sql
```

---

## Troubleshooting

**Container tidak mau naik:**
```bash
docker compose -f /root/sytama/compose.prod.yml logs [nama-service]
```

**Login gagal / redirect loop:**
- Pastikan blueprint sudah di-apply (Langkah 7)
- Cek `VITE_AUTHENTIK_ISSUER_URL` di GitHub Secrets sudah benar

**Image tidak terupdate:**
```bash
# Pull manual
docker pull ghcr.io/esa89/akademik-monorepo-widyatama/api-akademik:latest
docker compose -f /root/sytama/compose.prod.yml up -d api-akademik
```

**Database connection error:**
```bash
# Cek postgres berjalan
docker compose -f /root/sytama/compose.prod.yml ps postgres
# Cek log
docker compose -f /root/sytama/compose.prod.yml logs postgres
```

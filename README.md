# SYTAMA — Sistem Akademik Widyatama

Sistem manajemen akademik berbasis OBE (Outcome-Based Education) untuk Universitas Widyatama, dibangun sebagai monorepo dengan SSO menggunakan Authentik.

## Arsitektur

```
akademik-monorepo-widyatama/
├── apps/
│   ├── fe-akademik/        # Portal Admin Akademik      → localhost:6175
│   ├── fe-jurusan/         # Portal Jurusan / Kaprodi   → localhost:6174
│   ├── fe-dosen/           # Portal Dosen               → localhost:6173
│   ├── fe-identity/        # Portal Manajemen Akun      → localhost:5174
│   ├── api-akademik/       # API Akademik (NestJS)      → localhost:3015
│   ├── api-obe/            # API OBE (NestJS)           → localhost:3014
│   └── api-identity/       # API Identity (NestJS)      → localhost:3013
├── packages/
│   ├── ui/                 # @widyatama/ui — komponen bersama
│   ├── sso-react/          # @widyatama/sso-react — OIDC untuk React
│   ├── sso-types/          # @widyatama/sso-types — type definitions
│   └── sso-core/           # @widyatama/sso-core — guard NestJS
└── infra/
    ├── docker/             # Docker Compose utama
    └── authentik/          # Blueprint SSO Authentik
```

**SSO (Authentik)**: `localhost:9010`

---

## Prasyarat

- Docker Desktop / Docker Engine + Compose v2
- Node.js 20+ dan pnpm 10+ _(hanya untuk development lokal tanpa Docker)_

---

## Menjalankan Pertama Kali

### Langkah 1 — Siapkan environment file

File `.env` sudah tersedia di `infra/docker/.env` dengan nilai default untuk development. Tidak perlu diubah.

### Langkah 2 — Build & jalankan semua service

```bash
pnpm docker:build   # build images (dilakukan sekali, atau saat ada perubahan Dockerfile)
pnpm docker         # jalankan semua service di background
```

Tunggu ±60–90 detik hingga Authentik selesai inisialisasi. Pantau progresnya:

```bash
pnpm docker:logs authentik-server
```

Authentik siap ketika log menampilkan `Starting server ...`. Admin dibuat otomatis dari env variable `AUTHENTIK_BOOTSTRAP_*` — tidak perlu setup wizard.

### Langkah 3 — Terapkan Blueprint SSO (hanya sekali)

Blueprint membuat semua OAuth2 provider, aplikasi, grup, dan user test secara otomatis.

```bash
docker compose -f infra/docker/docker-compose.yml exec authentik-worker \
  ak apply_blueprint /blueprints/custom/widyatama-sso.yaml
```

Perintah selesai tanpa output error = berhasil. Verifikasi via **Applications → Providers** di Admin UI (`http://localhost:9010/if/admin/`) — harus muncul 4 provider: `Widyatama SSO`, `Widyatama Identity`, `Widyatama Jurusan`, `Widyatama Akademik`.

### Langkah 4 — Set password user test (hanya sekali)

Blueprint membuat user tapi tidak bisa set password secara otomatis. Lakukan via Admin UI:

1. Buka **http://localhost:9010/if/admin/**
2. Login dengan `admin@widyatama.ac.id` / `WidyatamaAdmin123!`
3. Pergi ke **Directory → Users**
4. Untuk setiap user berikut, klik nama user → **Set password** → isi `TestPassword123!`:
   - `admin.akademik`
   - `dosen.test`
   - `mahasiswa.test`
   - `kaprodi.test`

### Langkah 5 — Akses aplikasi

| Aplikasi | URL | Login dengan |
|----------|-----|--------------|
| **Admin Akademik** | http://localhost:6175 | `admin.akademik` |
| **Portal Jurusan** | http://localhost:6174 | `kaprodi.test` |
| **Portal Dosen** | http://localhost:6173 | `dosen.test` |
| **Authentik Admin** | http://localhost:9010/if/admin/ | `admin@widyatama.ac.id` |

---

## Perintah Harian

```bash
pnpm docker          # start semua service (jika sudah di-build)
pnpm docker:stop     # stop tanpa hapus container
pnpm docker:down     # stop dan hapus container (volume tetap ada)
pnpm docker:logs     # lihat log semua service
pnpm docker:build    # rebuild images (jalankan setelah ubah Dockerfile atau dependencies baru)
```

Log service tertentu:

```bash
pnpm docker:logs fe-akademik
pnpm docker:logs api-akademik
pnpm docker:logs authentik-server
```

---

## Akun & Kredensial Default

| Akun | Username | Password | Role | Portal |
|------|----------|----------|------|--------|
| Admin Authentik | `admin@widyatama.ac.id` | `WidyatamaAdmin123!` | Superuser Authentik | Authentik Admin |
| Admin Akademik | `admin.akademik` | `TestPassword123!` | admin_akademik | fe-akademik |
| Kaprodi Test | `kaprodi.test` | `TestPassword123!` | kaprodi | fe-jurusan |
| Dosen Test | `dosen.test` | `TestPassword123!` | dosen | fe-dosen |
| Mahasiswa Test | `mahasiswa.test` | `TestPassword123!` | mahasiswa | — |

**OAuth2 Client Secret** (semua app): `widyatama-client-secret-change-me-in-production`

---

## Arsitektur Login (SSO Flow)

```
fe-akademik / fe-jurusan / fe-dosen
       │
       │  OIDC issuer: http://localhost:3013 (api-identity sebagai proxy)
       ▼
  api-identity ──► redirect ke fe-identity (login UI custom di :5174)
                         │
                         │  POST /auth/login (username + password)
                         ▼
                    api-identity ──► Authentik (password grant)
                         │
                         └──► token kembali ke app pemanggil
```

**fe-identity** adalah login UI terpusat untuk semua app. Semua app (fe-akademik, fe-jurusan, fe-dosen) pakai `VITE_AUTHENTIK_ISSUER_URL=http://localhost:3013`.

## OAuth2 Applications di Authentik

| App | Client ID | Issuer URL | Keterangan |
|-----|-----------|------------|------------|
| fe-dosen | `fe-dosen` | `http://localhost:3013` | via api-identity proxy |
| fe-jurusan | `fe-jurusan` | `http://localhost:3013` | via api-identity proxy |
| fe-akademik | `fe-akademik` | `http://localhost:3013` | via api-identity proxy |
| fe-identity | `fe-identity` | `localhost:9010/application/o/widyatama-identity/` | langsung ke Authentik |

---

## Troubleshooting

### Login redirect gagal / "Invalid client"
Blueprint belum diterapkan atau Authentik belum selesai start. Jalankan ulang Langkah 4.

### "Invalid redirect_uri"
Gunakan `localhost` (bukan `127.0.0.1`) saat mengakses aplikasi di browser.

### Frontend masih loading lama saat pertama kali
Frontend menjalankan `pnpm build` untuk shared packages saat startup. Tunggu hingga log menampilkan `VITE ready in ... ms`:
```bash
docker compose -f infra/docker/docker-compose.yml logs -f fe-akademik
```

### Port sudah dipakai
Edit `infra/docker/.env` dan ubah port yang konflik:
```env
AUTHENTIK_PORT_HTTP=9010
```

### Reset total (hapus semua data dan mulai dari awal)
```bash
pnpm docker:down
docker volume rm $(docker volume ls -q --filter name=widyatama-akademik) 2>/dev/null || true
pnpm docker:build
pnpm docker
# Ulangi Langkah 3–5
```

### Disk Docker penuh
```bash
docker system df                 # cek penggunaan
docker builder prune -f          # hapus build cache
docker image prune -a -f         # hapus image tidak terpakai
```

---

## Development Lokal (satu service di luar Docker)

Untuk menjalankan misalnya `fe-akademik` langsung di host (hot-reload lebih cepat) sambil service lain tetap di Docker:

```bash
# Pastikan service Docker lain jalan
pnpm docker

# Install & build packages
pnpm install
pnpm build --filter=@widyatama/ui --filter=@widyatama/sso-react --filter=@widyatama/sso-types

# Jalankan fe-akademik lokal
cd apps/fe-akademik
VITE_API_AKADEMIK_URL=http://localhost:3015/api \
VITE_AUTHENTIK_CLIENT_ID=fe-akademik \
VITE_AUTHENTIK_CLIENT_SECRET=widyatama-client-secret-change-me-in-production \
VITE_AUTHENTIK_ISSUER_URL=http://localhost:9010/application/o/fe-akademik/ \
pnpm dev
```

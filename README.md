# Akademik Monorepo Widyatama

Sistem akademik berbasis microservices dengan SSO menggunakan Zitadel, dibangun dengan arsitektur monorepo untuk skalabilitas dan maintainability yang optimal.

## 🏗️ Arsitektur

```
akademik-monorepo-widyatama/
├─ apps/                            # 🚀 Aplikasi yang dapat dijalankan
│  ├─ fe-dosen/                     # Next.js - Portal Dosen
│  ├─ fe-mahasiswa/                 # Next.js - Portal Mahasiswa  
│  ├─ fe-akademik/                  # Next.js - Portal Akademik
│  ├─ api-nilai/                    # NestJS - Service Nilai
│  ├─ api-kehadiran/                # NestJS - Service Kehadiran
│  └─ api-identity/                 # NestJS - Service Identity
│
├─ packages/                        # 📦 Shared Libraries
│  ├─ ui/                           # @widyatama/ui - Komponen UI
│  ├─ sso-types/                    # @widyatama/sso-types - Type definitions
│  ├─ sso-core/                     # @widyatama/sso-core - NestJS SSO utilities
│  └─ sso-next/                     # @widyatama/sso-next - Next.js SSO utilities
│
└─ infra/                           # 🛠️ Infrastructure
   ├─ docker/                       # Docker configurations
   ├─ zitadel/                      # SSO Provider setup
   ├─ db/                           # Database setup & migrations
   └─ k8s/                          # Kubernetes manifests (optional)
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm 8+ (atau gunakan `nvm use 20` di WSL jika diperlukan)
- Docker & Docker Compose

### 1. Clone & Install
```bash
git clone <repository-url>
cd akademik-monorepo-widyatama
pnpm install
```

### 2. Setup Environment
```bash
cp .env.example .env
# Edit .env with your configurations
```

### 3. Start Applications
```bash
# Start fe-dosen (Vite)
cd apps/fe-dosen
pnpm dev

# Start fe-akademik (Vite) 
cd apps/fe-akademik
pnpm dev

# Start infrastructure (Docker)
cd infra/zitadel
docker-compose up -d
```

### 4. Access Applications
- **Zitadel Console**: http://localhost:8088
- **Dosen Portal**: http://localhost:5173 (Vite default)
- **Akademik Portal**: http://localhost:5174 (atau port lain yang tersedia)
- **API Services**: Will be available when Docker is implemented

## 🏢 Applications

### Frontend Applications
| App | Port | Framework | Status | Description |
|-----|------|-----------|--------|-------------|
| `fe-dosen` | 5173 | Vite+React | ✅ **Ready** | Portal untuk dosen (dipindahkan dari packages/dosen) |
| `fe-akademik` | 5174 | Vite+React | ✅ **Ready** | Portal administrasi akademik (dipindahkan dari packages/akademik) |
| `fe-mahasiswa` | 5175 | Next.js | 🚧 **Planned** | Portal untuk mahasiswa |

### Backend Services
| Service | Port | Framework | Status | Description |
|---------|------|-----------|--------|-------------|
| `api-nilai` | 3001 | NestJS | 🚧 **Planned** | Microservice untuk pengelolaan nilai |
| `api-kehadiran` | 3002 | NestJS | 🚧 **Planned** | Microservice untuk kehadiran |
| `api-identity` | 3003 | NestJS | 🚧 **Planned** | Service agregasi identity & roles |

## 📦 Shared Packages

### `@widyatama/ui`
Komponen UI bersama yang digunakan di semua frontend aplikasi.

### `@widyatama/sso-types` 
Type definitions untuk SSO, termasuk token claims dan user session types.

### `@widyatama/sso-core`
Utilities untuk NestJS backend:
- JWT Strategy
- Auth Guards  
- Role Guards
- Decorators

### `@widyatama/sso-next`
Utilities untuk Next.js frontend:
- NextAuth configuration
- Auth middleware
- React hooks
- Auth components

## 🔐 Authentication & Authorization

### SSO Flow
1. User mengakses aplikasi frontend
2. Redirect ke Zitadel untuk authentication
3. Zitadel mengembalikan JWT token
4. Frontend menggunakan token untuk API calls
5. Backend memvalidasi token menggunakan JWKS

### Roles
- `dosen`: Akses ke fitur pengajaran
- `mahasiswa`: Akses ke fitur mahasiswa
- `admin_akademik`: Akses administratif penuh
- `kaprodi`: Akses sebagai kepala program studi

## 🐳 Docker Development

### Local Development
```bash
# Start all services dengan hot-reload
docker-compose -f infra/docker/compose.local.yml up -d

# View logs
docker-compose -f infra/docker/compose.local.yml logs -f

# Stop services  
docker-compose -f infra/docker/compose.local.yml down
```

### Production Deployment
```bash
# Build & start production services
docker-compose -f infra/docker/compose.prod.yml up -d

# Dengan Traefik reverse proxy & SSL
docker-compose -f infra/docker/compose.prod.yml up -d traefik
```

## 📊 Database

### Schema
- **users**: Data pengguna (sinkron dari Zitadel)
- **roles**: Definisi role
- **mata_kuliah**: Data mata kuliah
- **kelas**: Data kelas perkuliahan
- **kehadiran**: Data kehadiran mahasiswa
- **nilai**: Data nilai mahasiswa

### Migrations
```bash
# Jalankan migrasi
docker-compose exec postgres psql -U akademik_user -d akademik_db -f /docker-entrypoint-initdb.d/01-init.sql
```

## 🛠️ Development

### Building
```bash
# Build semua packages
pnpm build

# Build specific app
pnpm build --filter=fe-dosen

# Build dependencies
pnpm build --filter=@widyatama/ui
```

### Development Mode
```bash
# Start all in dev mode
pnpm dev

# Start specific app
pnpm dev --filter=fe-dosen
```

### Linting & Testing
```bash
# Lint all
pnpm lint

# Test all
pnpm test

# Type check
pnpm type-check
```

## 🚀 Deployment

### Environment Variables
Sesuaikan variabel environment untuk setiap stage:
- Development: `.env.local`
- Staging: `.env.staging` 
- Production: `.env.production`

### Domain Setup
Production domains:
- `dosen.widyatama.ac.id`
- `mahasiswa.widyatama.ac.id`
- `akademik.widyatama.ac.id`
- `api-nilai.widyatama.ac.id`
- `api-kehadiran.widyatama.ac.id`
- `api-identity.widyatama.ac.id`

### SSL Certificates
Traefik secara otomatis menangani SSL certificates menggunakan Let's Encrypt.

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

Untuk bantuan dan pertanyaan:
- Email: dev@widyatama.ac.id
- Documentation: [Link to docs]
- Issues: [GitHub Issues]

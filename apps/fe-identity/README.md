# fe-identity - Portal Login Widyatama

Aplikasi login terpadu untuk Universitas Widyatama dengan desain modern split-screen.

## Fitur

- **Desain Split-Screen**: Visual menarik di sisi kiri, form login di sisi kanan
- **SSO Integration**: Terintegrasi dengan Authentik OIDC
- **Multi-Portal Access**: Link cepat ke portal Dosen, Mahasiswa, dan Akademik
- **Responsive**: Tampilan optimal di desktop dan mobile
- **Widyatama UI**: Menggunakan komponen `@widyatama/ui`

## Tech Stack

- Vite + React + TypeScript
- Tailwind CSS
- `@widyatama/ui` - Komponen UI
- `@widyatama/sso-react` - Autentikasi SSO
- React Router

## Development

```bash
# Install dependencies
pnpm install

# Setup environment
cp .env.example .env
# Edit .env dengan konfigurasi Authentik

# Start development server
pnpm dev
```

Akses aplikasi di `http://localhost:3020`

## Build

```bash
pnpm build
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_AUTHENTIK_ISSUER_URL` | URL Authentik issuer | `http://localhost:9000/application/o/widyatama/` |
| `VITE_AUTHENTIK_CLIENT_ID` | Client ID untuk fe-identity | `fe-identity` |
| `VITE_AUTHENTIK_CLIENT_SECRET` | Client Secret | - |

## Struktur

```
src/
├── pages/
│   ├── LoginPage.tsx    # Halaman login utama
│   └── CallbackPage.tsx # Halaman callback SSO
├── App.tsx              # Router & AuthProvider
├── main.tsx             # Entry point
└── index.css            # Global styles
```

## Authentik Setup

1. Buat Application di Authentik dengan slug `fe-identity`
2. Buat OAuth2/OIDC Provider
3. Set redirect URI: `http://localhost:3020/auth/callback`
4. Copy Client ID dan Client Secret ke `.env`

## Screenshot

Desain mengikuti konsep split-screen dengan:
- **Left Panel**: Gradient overlay dengan statistik kampus dan fitur unggulan
- **Right Panel**: Form login bersih dengan input email/password dan tombol SSO

# Panduan Pengguna — SYTAMA OBE Widyatama

Sistem Akademik berbasis OBE (Outcome-Based Education) untuk Universitas Widyatama.

---

## Daftar Isi

1. [Cara Mendapatkan Akun](#1-cara-mendapatkan-akun)
2. [Cara Login](#2-cara-login)
3. [Akses per Peran](#3-akses-per-peran)
4. [Lupa Password](#4-lupa-password)
5. [Cara Logout](#5-cara-logout)

---

## 1. Cara Mendapatkan Akun

Akun tidak bisa dibuat sendiri. Admin sistem (Kaprodi atau staf IT) yang membuat akun untuk setiap pengguna.

**Hubungi admin untuk mendapatkan:**
- Username
- Password awal

> Setelah login pertama kali, disarankan untuk mengganti password melalui halaman profil Authentik di `https://auth.obe-if-utama.web.id`.

---

## 2. Cara Login

### Langkah-langkah

1. Buka aplikasi sesuai peran Anda (lihat [Akses per Peran](#3-akses-per-peran))
2. Anda akan diarahkan ke halaman login SSO
3. Masukkan **Username** dan **Password** yang diberikan admin
4. Klik tombol **Login**
5. Jika berhasil, Anda akan otomatis diarahkan ke halaman utama aplikasi

### Tampilan Halaman Login

```
┌─────────────────────────────────────┐
│         SYTAMA — OBE Widyatama      │
│                                     │
│  Username                           │
│  ┌─────────────────────────────┐    │
│  │ contoh: kaprodi.if          │    │
│  └─────────────────────────────┘    │
│                                     │
│  Password                           │
│  ┌─────────────────────────────┐    │
│  │ ••••••••••••                │    │
│  └─────────────────────────────┘    │
│                                     │
│  [          Login           ]       │
└─────────────────────────────────────┘
```

---

## 3. Akses per Peran

| Peran | URL Aplikasi | Fungsi Utama |
|-------|-------------|--------------|
| **Kaprodi / Prodi** | https://prodi.obe-if-utama.web.id | Kelola CPL, CPMK, Sub-CPMK, BK, Komponen Penilaian, Visi Misi |
| **Staf Akademik** | https://akademik.obe-if-utama.web.id | Kelola Kelas, Mahasiswa, Dosen, Fakultas |
| **Dosen** | https://dosen.obe-if-utama.web.id | Input nilai CPMK per kelas |

> Setiap pengguna hanya bisa mengakses aplikasi sesuai perannya. Jika mencoba membuka aplikasi peran lain, sistem akan menolak akses.

---

## 4. Lupa Password

1. Hubungi **admin sistem** atau **Kaprodi**
2. Admin akan mereset password melalui halaman admin Authentik
3. Password baru akan diberikan langsung oleh admin

### Untuk Admin — Cara Reset Password User

1. Login ke **Authentik Admin** di `https://auth.obe-if-utama.web.id/if/admin/`
2. Masuk ke menu **Directory → Users**
3. Cari nama pengguna → klik nama tersebut
4. Klik tombol **Set Password**
5. Masukkan password baru → klik **Change Password**
6. Sampaikan password baru kepada pengguna secara langsung (jangan lewat chat/email tidak aman)

---

## 5. Cara Logout

1. Klik nama/avatar profil di pojok kanan atas aplikasi
2. Pilih **Logout**
3. Anda akan keluar dari semua aplikasi SYTAMA sekaligus (Single Sign-Out)

---

## Catatan Penting

- **Jangan bagikan password** ke orang lain
- Password bersifat **case-sensitive** (huruf besar dan kecil dibedakan)
- Satu akun SSO berlaku untuk semua aplikasi SYTAMA (Prodi, Akademik, Dosen)
- Jika muncul error saat login, coba refresh halaman dan ulangi. Jika masih gagal, hubungi admin

---

## Kontak Admin

Hubungi admin sistem jika mengalami kendala:
- Tidak bisa login
- Akun terkunci
- Data tidak sesuai peran Anda

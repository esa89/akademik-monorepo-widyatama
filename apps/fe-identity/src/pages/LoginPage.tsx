import { useState, useEffect } from 'react';
import { Button, Input } from '@widyatama/ui';
import {
  Award, ShieldCheck, Globe, GraduationCap, Users, BookOpen,
  ArrowRight, ClipboardList, User, BarChart2, ArrowUpRight,
} from 'lucide-react';
import logoWidyatama from '@ui-assets/logo widyatama.webp';

// ── Keunggulan (sumber: widyatama.ac.id) ──────────────────────────────────
const KEUNGGULAN = [
  {
    icon: <Award size={18} />,
    iconBg: 'bg-yellow-400/20 text-yellow-300',
    title: 'Akreditasi Unggul',
    desc: 'Peringkat Unggul/A dari BAN-PT & LAMEMBA untuk berbagai program studi',
  },
  {
    icon: <ShieldCheck size={18} />,
    iconBg: 'bg-green-400/20 text-green-300',
    title: 'Tersertifikasi ISO',
    desc: 'ISO 9001:2008 oleh TUV Germany di seluruh program',
  },
  {
    icon: <Globe size={18} />,
    iconBg: 'bg-blue-400/20 text-blue-300',
    title: 'Anggota IAU-UNESCO',
    desc: 'Bergabung sejak 2011, jaringan universitas internasional global',
  },
  {
    icon: <GraduationCap size={18} />,
    iconBg: 'bg-purple-400/20 text-purple-300',
    title: '22 Program Studi',
    desc: '5 Fakultas dari Ekonomi, Teknik, Bahasa, DKV, Sosial & Politik',
  },
  {
    icon: <Users size={18} />,
    iconBg: 'bg-cyan-400/20 text-cyan-300',
    title: '7 Negara Mitra',
    desc: 'Kerjasama aktif dengan USA, Prancis, Jerman, Austria, Malaysia, Jepang',
  },
  {
    icon: <BookOpen size={18} />,
    iconBg: 'bg-orange-400/20 text-orange-300',
    title: 'Perpustakaan Digital',
    desc: '33.000+ judul, peringkat #24 nasional, akses e-library & e-journal',
  },
];

// ── Stats ──────────────────────────────────────────────────────────────────
const STATS = [
  { value: '15.000+', label: 'Mahasiswa' },
  { value: '500+',    label: 'Dosen & Staff' },
  { value: '50+',     label: 'Tahun Berdiri' },
];

// ── Portal Cards ───────────────────────────────────────────────────────────
const PORTALS = [
  {
    href: 'http://dosen.widyatama.127.0.0.1.nip.io:6173',
    label: 'Portal Dosen',
    desc: 'Input nilai, presensi & monitoring CPL',
    icon: <ClipboardList size={22} />,
    iconBg: 'bg-emerald-100 text-emerald-600',
    accent: 'hover:border-emerald-400 hover:shadow-emerald-100',
    badge: 'bg-emerald-50 text-emerald-600',
    arrowColor: 'text-emerald-500',
  },
  {
    href: 'http://localhost:5175',
    label: 'Portal Mahasiswa',
    desc: 'Jadwal kuliah, KRS, nilai & presensi',
    icon: <User size={22} />,
    iconBg: 'bg-blue-100 text-blue-600',
    accent: 'hover:border-blue-400 hover:shadow-blue-100',
    badge: 'bg-blue-50 text-blue-600',
    arrowColor: 'text-blue-500',
  },
  {
    href: 'http://akademik.widyatama.127.0.0.1.nip.io:6175',
    label: 'Portal Akademik',
    desc: 'Kurikulum, mata kuliah & semester',
    icon: <BarChart2 size={22} />,
    iconBg: 'bg-indigo-100 text-indigo-600',
    accent: 'hover:border-indigo-400 hover:shadow-indigo-100',
    badge: 'bg-indigo-50 text-indigo-600',
    arrowColor: 'text-indigo-500',
  },
];

const API_IDENTITY_URL = import.meta.env.VITE_API_IDENTITY_URL || 'http://localhost:3013';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [entered, setEntered] = useState(false);

  useEffect(() => { const t = setTimeout(() => setEntered(true), 60); return () => clearTimeout(t); }, []);

  const urlParams = new URLSearchParams(window.location.search);
  const returnTo = urlParams.get('return_to') || '';
  const state = urlParams.get('state') || '';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_IDENTITY_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email, password }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Login failed');

      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      localStorage.setItem('user', JSON.stringify(data.user));

      const userRoles: string[] = data.user?.roles || [];
      const rolePortalMap: Record<string, string> = {
        dosen: 'http://localhost:6173',
        mahasiswa: 'http://localhost:5175',
        admin_akademik: 'http://localhost:6175',
        jurusan: 'http://localhost:6174',
        kaprodi: 'http://localhost:6174',
      };
      const correctPortal = userRoles.map(r => rolePortalMap[r]).find(url => url) || 'http://localhost:6173';

      const mockCode = data.user?.username === 'admin.akademik'
        ? 'mock-code-admin.akademik'
        : data.user?.username === 'mahasiswa.test'
        ? 'mock-code-mahasiswa.test'
        : 'mock-code-dosen.test';

      if (returnTo) {
        const returnUrl = new URL(decodeURIComponent(returnTo));
        const requestedPortal = returnUrl.origin;
        if (userRoles.some(r => rolePortalMap[r] === requestedPortal)) {
          returnUrl.searchParams.set('code', mockCode);
          if (state) returnUrl.searchParams.set('state', state);
          window.location.href = returnUrl.toString();
        } else {
          const targetUrl = new URL(`${correctPortal}/auth/callback`);
          targetUrl.searchParams.set('code', mockCode);
          if (state) targetUrl.searchParams.set('state', state);
          window.location.href = targetUrl.toString();
        }
      } else {
        const targetUrl = new URL(`${correctPortal}/auth/callback`);
        targetUrl.searchParams.set('code', mockCode);
        if (state) targetUrl.searchParams.set('state', state);
        window.location.href = targetUrl.toString();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login gagal. Periksa kembali kredensial Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex overflow-hidden">

      {/* ══ LEFT PANEL — Visual / Keunggulan ══════════════════════════════ */}
      <div
        className={`hidden md:flex md:w-1/2 xl:w-[55%] h-full relative overflow-hidden transition-all duration-700 ease-out
          ${entered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'}`}
      >
        {/* Background campus image */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200&auto=format&fit=crop&q=80"
            alt="Campus"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#0f2340]/95 via-[#1a2f6e]/88 to-[#0d1b3e]/95" />
        </div>

        {/* Floating decorative blobs */}
        <div className="absolute top-10 right-10 w-48 h-48 rounded-full bg-blue-500/10 anim-float-slow pointer-events-none" />
        <div className="absolute bottom-20 left-8 w-36 h-36 rounded-full bg-indigo-400/10 anim-float-mid pointer-events-none" />

        <div className="relative z-10 flex flex-col h-full px-8 xl:px-12 py-8">

          {/* Logo + Stats (top bar) */}
          <div className="flex items-center justify-between gap-6 mb-8">
            <img
              src={logoWidyatama}
              alt="Widyatama"
              className="h-14 w-auto object-contain brightness-0 invert shrink-0"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />

            {/* Stats — top right */}
            <div className="flex items-center divide-x divide-white/20">
              {STATS.map((s, i) => (
                <div key={i} className="text-center px-4 first:pl-0 last:pr-0">
                  <p className="text-white font-bold text-base leading-tight tabular-nums">{s.value}</p>
                  <p className="text-blue-300/60 text-[10px] mt-0.5 whitespace-nowrap">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Hero text */}
          <div className="mb-5">
            <h2 className="text-white font-bold text-2xl xl:text-3xl leading-snug">
              Membentuk Generasi<br />
              <span className="text-blue-300">Unggul & Berdaya Saing</span>
            </h2>
            <p className="text-white/60 text-sm mt-3 leading-relaxed max-w-sm">
              Bergabunglah bersama lebih dari 15.000 mahasiswa di Universitas Widyatama,
              kampus swasta terkemuka di Bandung yang berkomitmen pada kualitas akademik internasional.
            </p>
          </div>

          {/* Keunggulan grid 2×3 */}
          <div className="flex-1 grid grid-cols-2 gap-3 content-start">
            {KEUNGGULAN.map((item, i) => (
              <div
                key={i}
                className={`group bg-white/8 hover:bg-white/14 border border-white/10 hover:border-white/25 rounded-xl p-3.5 transition-all duration-300 cursor-default`}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2.5 ${item.iconBg}`}>
                  {item.icon}
                </div>
                <p className="text-white text-xs font-semibold leading-tight mb-1">{item.title}</p>
                <p className="text-white/55 text-[10px] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* ══ RIGHT PANEL — Login Form ═════════════════════════════════════ */}
      <div
        className={`flex-1 h-full overflow-y-auto flex flex-col items-center justify-center px-6 sm:px-10 md:px-14 py-8 bg-gray-50/50 transition-all duration-700 ease-out delay-150
          ${entered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="md:hidden flex justify-center mb-8">
            <img
              src={logoWidyatama}
              alt="Widyatama"
              className="h-16 w-auto object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>

          {/* Sign up hint */}
          <div className="flex justify-end mb-6">
            <span className="text-gray-500 text-sm">Belum punya akun? </span>
            <a href="#" className="text-primary font-medium text-sm ml-1 hover:underline">
              Hubungi Admin
            </a>
          </div>

          {/* Welcome */}
          <div className="mb-7">
            <h2 className="text-2xl font-bold text-gray-900">
              Selamat Datang 👋
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Masuk untuk mengakses portal akademik Widyatama.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm text-center">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Email atau Username"
              type="text"
              placeholder="nama@widyatama.ac.id"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <div>
              <Input
                label="Kata Sandi"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <div className="flex justify-end mt-1">
                <a href="#" className="text-primary text-sm font-medium hover:underline">
                  Lupa kata sandi?
                </a>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full justify-center"
              disabled={isLoading}
            >
              {isLoading ? 'Memuat...' : 'Masuk ke Portal'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-4">
            Dengan masuk, Anda menyetujui{' '}
            <a href="#" className="text-primary hover:underline">Syarat & Ketentuan</a>
            {' '}serta{' '}
            <a href="#" className="text-primary hover:underline">Kebijakan Privasi</a>.
          </p>

          {/* ── Portal Cards — horizontal ────────────────────────── */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4 text-center">
              Akses Langsung ke Portal
            </p>
            <div className="grid grid-cols-3 gap-2.5">
              {PORTALS.map((portal) => (
                <a
                  key={portal.href}
                  href={portal.href}
                  className={`group flex flex-col items-center text-center bg-white border border-gray-200 rounded-xl px-3 py-4
                    transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${portal.accent}`}
                >
                  {/* Icon */}
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 transition-transform duration-200 group-hover:scale-110 ${portal.iconBg}`}>
                    {portal.icon}
                  </div>

                  {/* Text */}
                  <p className="text-xs font-semibold text-gray-900 leading-tight mb-1">{portal.label}</p>
                  <p className="text-[10px] text-gray-400 leading-snug">{portal.desc}</p>

                  {/* Arrow badge */}
                  <div className={`mt-3 w-6 h-6 rounded-md flex items-center justify-center ${portal.badge} transition-all duration-200 group-hover:scale-110`}>
                    <ArrowUpRight size={13} className={portal.arrowColor} />
                  </div>
                </a>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

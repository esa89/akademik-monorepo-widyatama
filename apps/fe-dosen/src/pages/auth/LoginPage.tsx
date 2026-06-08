import { useAuth } from '@widyatama/sso-react';
import { Button } from '@widyatama/ui';
import {
  LogIn, ClipboardList, Calendar, Users, Target, FileText, TrendingUp,
  Bell, CalendarDays, ChevronRight, GraduationCap, BookOpen, ChevronDown,
} from 'lucide-react';
import logoWidyatama from '@ui-assets/logo widyatama.webp';
import { useEffect, useState, useCallback } from 'react';

// ── Dummy announcements ────────────────────────────────────────────────────
const TODAY = new Date('2025-11-21');
function daysDiff(dateStr: string): number {
  const parts = dateStr.split(' ');
  const months: Record<string, number> = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, Mei: 4, Jun: 5,
    Jul: 6, Agu: 7, Sep: 8, Okt: 9, Nov: 10, Des: 11,
  };
  const d = new Date(Number(parts[2]), months[parts[1]] ?? 0, Number(parts[0]));
  return Math.floor((TODAY.getTime() - d.getTime()) / 86_400_000);
}

const ANNOUNCEMENTS = [
  {
    id: 1, tag: 'Penilaian', tagColor: 'bg-emerald-100 text-emerald-700',
    title: 'Batas Akhir Input Nilai UTS Ganjil 2025/2026', date: '20 Nov 2025',
    desc: 'Nilai UTS semester ganjil 2025/2026 wajib diinput paling lambat 30 November 2025.',
  },
  {
    id: 2, tag: 'Jadwal', tagColor: 'bg-blue-100 text-blue-700',
    title: 'Perubahan Jadwal Kuliah Minggu Ke-14', date: '18 Nov 2025',
    desc: 'Terdapat pergeseran jadwal untuk beberapa ruangan karena persiapan dekorasi UAS.',
  },
  {
    id: 3, tag: 'OBE', tagColor: 'bg-purple-100 text-purple-700',
    title: 'Workshop Input CPMK & Sub-CPMK', date: '15 Nov 2025',
    desc: 'Dosen diminta hadir di workshop pengisian data CPMK pada 2 Desember 2025 di Lab IT Lt. 3.',
  },
  {
    id: 4, tag: 'Akademik', tagColor: 'bg-orange-100 text-orange-700',
    title: 'Pengumpulan Laporan Kegiatan Mengajar', date: '12 Nov 2025',
    desc: 'Laporan kegiatan mengajar semester ganjil dikumpulkan paling lambat 5 Januari 2026.',
  },
  {
    id: 5, tag: 'Fitur Baru', tagColor: 'bg-teal-100 text-teal-700',
    title: 'Ekspor Rekap Nilai PDF Tersedia', date: '10 Nov 2025',
    desc: 'Dosen kini dapat mengekspor rekap nilai dalam format PDF langsung dari portal dosen.',
  },
];

// ── Fitur portal dosen ─────────────────────────────────────────────────────
const FITUR = [
  { icon: <ClipboardList size={18} />, title: 'Input Penilaian', desc: 'Rekap nilai tugas, UTS, UAS terintegrasi CPMK' },
  { icon: <Calendar size={18} />,      title: 'Jadwal Mengajar', desc: 'Lihat dan kelola jadwal kuliah per semester' },
  { icon: <Users size={18} />,         title: 'Presensi Mahasiswa', desc: 'Rekap kehadiran mahasiswa real-time' },
  { icon: <Target size={18} />,        title: 'Monitoring CPL', desc: 'Pantau ketercapaian CPL setiap mata kuliah' },
  { icon: <FileText size={18} />,      title: 'Upload RPS', desc: 'Kelola RPS dan silabus sesuai standar OBE' },
  { icon: <TrendingUp size={18} />,    title: 'Analisis Kinerja', desc: 'Grafik progress mahasiswa per CPL & CPMK' },
];

// ── Stats ──────────────────────────────────────────────────────────────────
const STATS = [
  { target: 250, suffix: '+', label: 'Mahasiswa' },
  { target: 12,  suffix: '',  label: 'CPL' },
  { target: 38,  suffix: '',  label: 'CPMK' },
];

// ── Other portals ──────────────────────────────────────────────────────────
const OTHER_PORTALS = [
  {
    href: 'http://jurusan.widyatama.127.0.0.1.nip.io:6174',
    label: 'Portal Jurusan',
    desc: 'Dashboard CPL & OBE Informatika',
    icon: <GraduationCap size={18} />,
    color: 'hover:border-blue-400 hover:bg-blue-50',
    iconColor: 'text-blue-500 bg-blue-50',
  },
  {
    href: 'http://akademik.widyatama.127.0.0.1.nip.io:6175',
    label: 'Portal Akademik',
    desc: 'Kurikulum, Mata Kuliah & Semester',
    icon: <BookOpen size={18} />,
    color: 'hover:border-indigo-400 hover:bg-indigo-50',
    iconColor: 'text-indigo-500 bg-indigo-50',
  },
];

const TAGLINE = 'Kelola perkuliahan, penilaian, dan monitoring ketercapaian CPL mahasiswa secara real-time dalam satu platform terintegrasi.';

// ── Count-up hook ──────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 1400, start = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (now: number) => {
      if (!startTime) startTime = now;
      const progress = Math.min((now - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(ease * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return value;
}

function StatCounter({ target, suffix, label, start }: { target: number; suffix: string; label: string; start: boolean }) {
  const val = useCountUp(target, 1400, start);
  return (
    <div className="text-center">
      <p className="text-white font-bold text-lg tabular-nums">{val}{suffix}</p>
      <p className="text-emerald-300/70 text-[11px]">{label}</p>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function LoginPage() {
  const { login, isLoading } = useAuth();

  const [entered, setEntered] = useState(false);
  useEffect(() => { const t = setTimeout(() => setEntered(true), 50); return () => clearTimeout(t); }, []);

  // Typewriter
  const [typed, setTyped] = useState('');
  const [typingDone, setTypingDone] = useState(false);
  useEffect(() => {
    if (!entered) return;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setTyped(TAGLINE.slice(0, i));
      if (i >= TAGLINE.length) { clearInterval(interval); setTypingDone(true); }
    }, 22);
    return () => clearInterval(interval);
  }, [entered]);

  // Count-up
  const [countStarted, setCountStarted] = useState(false);
  useEffect(() => {
    if (!entered) return;
    const t = setTimeout(() => setCountStarted(true), 800);
    return () => clearTimeout(t);
  }, [entered]);

  // Cycling fitur
  const [activeFitur, setActiveFitur] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActiveFitur((p) => (p + 1) % FITUR.length), 2500);
    return () => clearInterval(t);
  }, []);

  // Accordion
  const [openAnnounce, setOpenAnnounce] = useState<number | null>(null);
  const toggleAnnounce = useCallback((id: number) => {
    setOpenAnnounce((p) => (p === id ? null : id));
  }, []);

  return (
    <div className="min-h-screen flex overflow-hidden">

      {/* ══ KOLOM 1 — Fitur Portal Dosen ══════════════════════════════════ */}
      <div
        className={`hidden lg:flex lg:w-[30%] flex-col relative overflow-hidden transition-all duration-700 ease-out
          ${entered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}
          gradient-animate-dosen`}
      >
        <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-white/5 anim-float-slow" />
        <div className="absolute top-1/3 -right-16 w-56 h-56 rounded-full bg-emerald-500/10 anim-float-mid" />
        <div className="absolute -bottom-16 left-1/4 w-48 h-48 rounded-full bg-teal-400/10 anim-float-slow" style={{ animationDelay: '3s' }} />

        <div className="relative z-10 flex flex-col h-full p-8">
          {/* Logo */}
          <div className="mb-8">
            <img
              src={logoWidyatama}
              alt="Widyatama"
              className="h-10 object-contain brightness-0 invert mb-4"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <h2 className="text-white font-bold text-xl leading-tight">Portal<br />Dosen</h2>
            <p className="text-emerald-300 text-sm mt-1">Universitas Widyatama Bandung</p>
          </div>

          {/* Typewriter tagline */}
          <div className="bg-white/10 rounded-2xl p-4 mb-6 border border-white/10 min-h-[90px]">
            <p className="text-white/90 text-sm leading-relaxed italic">
              "{typed}
              {!typingDone && <span className="cursor-blink">|</span>}"
            </p>
          </div>

          {/* Cycling fitur */}
          <div className="flex-1 space-y-2">
            <p className="text-emerald-300 text-xs font-semibold uppercase tracking-widest mb-4">Fitur Unggulan</p>
            {FITUR.map((item, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 rounded-xl px-2 py-1.5 transition-all duration-500 cursor-default
                  ${activeFitur === i ? 'bg-white/15 ring-1 ring-white/20 scale-[1.02]' : 'hover:bg-white/8'}`}
              >
                <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-300
                  ${activeFitur === i ? 'bg-emerald-400/40 text-white' : 'bg-white/10 text-emerald-300'}`}>
                  {item.icon}
                </div>
                <div>
                  <p className={`text-sm font-medium leading-tight transition-colors duration-300 ${activeFitur === i ? 'text-white' : 'text-white/80'}`}>
                    {item.title}
                  </p>
                  <p className="text-emerald-300/80 text-xs mt-0.5 leading-tight">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-3 gap-3 border-t border-white/10 pt-6">
            {STATS.map((s) => (
              <StatCounter key={s.label} target={s.target} suffix={s.suffix} label={s.label} start={countStarted} />
            ))}
          </div>
        </div>
      </div>

      {/* ══ KOLOM 2 — Login Form ══════════════════════════════════════════ */}
      <div
        className={`flex-1 lg:w-[40%] flex flex-col items-center justify-center bg-[#f8f9fc] px-6 py-10 transition-all duration-700 ease-out delay-200
          ${entered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        <div className="w-full max-w-sm">

          {/* Logo mobile */}
          <div className="lg:hidden mb-8 text-center">
            <img
              src={logoWidyatama}
              alt="Widyatama"
              className="h-10 mx-auto object-contain mb-2"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Target className="w-7 h-7 text-emerald-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">SYTAMA Dosen</h1>
              <p className="text-gray-500 text-sm mt-1">Portal Dosen Widyatama</p>
              <p className="text-gray-400 text-xs mt-0.5">Outcome Based Education Management</p>
            </div>

            {/* SSO button */}
            <div className="relative">
              <span className="absolute inset-0 rounded-lg pointer-events-none">
                <span
                  className="absolute inset-0 rounded-lg opacity-40"
                  style={{ animation: 'ping-slow 2.4s ease-out infinite', background: 'rgba(16,185,129,0.35)' }}
                />
              </span>
              <Button
                variant="primary"
                className="w-full flex items-center justify-center gap-2 relative btn-shimmer border-0 text-white"
                onClick={() => login()}
                disabled={isLoading}
              >
                <LogIn size={16} />
                {isLoading ? 'Memuat...' : 'Masuk dengan SSO'}
              </Button>
            </div>

            <p className="text-center text-xs text-gray-400 mt-4">
              Gunakan akun SSO Universitas Widyatama
            </p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">Portal Lain</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Other portals */}
          <div className="space-y-3">
            {OTHER_PORTALS.map((portal) => (
              <a
                key={portal.href}
                href={portal.href}
                className={`group flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 transition-all ${portal.color}`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${portal.iconColor}`}>
                  {portal.icon}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{portal.label}</p>
                  <p className="text-xs text-gray-400">{portal.desc}</p>
                </div>
                <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
              </a>
            ))}
          </div>

          <p className="text-center text-xs text-gray-300 mt-8">
            © 2025 Universitas Widyatama · SYTAMA v1.0
          </p>
        </div>
      </div>

      {/* ══ KOLOM 3 — Pengumuman Dosen ═══════════════════════════════════ */}
      <div
        className={`hidden lg:flex lg:w-[30%] flex-col relative overflow-hidden bg-gradient-to-br from-[#ecfdf5] via-white to-[#f0fdf9] transition-all duration-700 ease-out delay-[400ms]
          ${entered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}
      >
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-emerald-100/40 -translate-y-1/2 translate-x-1/2 anim-float-slow" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-teal-100/40 translate-y-1/2 -translate-x-1/2 anim-float-mid" style={{ animationDelay: '2s' }} />

        <div className="relative z-10 flex flex-col h-full p-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Bell size={18} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-800 text-base">Pengumuman</h2>
              <p className="text-xs text-gray-400">Info terkini untuk dosen</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-hide">
            {ANNOUNCEMENTS.map((item, idx) => {
              const isNew = daysDiff(item.date) <= 3;
              const isOpen = openAnnounce === item.id;
              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-xl border transition-all duration-300 cursor-pointer
                    ${isOpen ? 'border-emerald-200 shadow-md' : 'border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200'}`}
                  style={{ animationDelay: `${idx * 80}ms` }}
                  onClick={() => toggleAnnounce(item.id)}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${item.tagColor}`}>
                          {item.tag}
                        </span>
                        {isNew && (
                          <span className="badge-pop text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-500 text-white">
                            BARU
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-400 flex items-center gap-1 shrink-0">
                        <CalendarDays size={10} />
                        {item.date}
                      </span>
                    </div>
                    <div className="flex items-start justify-between gap-1">
                      <p className={`text-sm font-semibold leading-tight transition-colors duration-200 ${isOpen ? 'text-emerald-600' : 'text-gray-800'}`}>
                        {item.title}
                      </p>
                      <ChevronDown
                        size={14}
                        className={`shrink-0 mt-0.5 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                      />
                    </div>
                  </div>

                  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="px-4 pb-4 border-t border-gray-50 pt-3">
                      <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 border-t border-gray-100 pt-4">
            <p className="text-xs text-gray-400 text-center">
              Informasi lebih lanjut hubungi<br />
              <span className="font-medium text-gray-600">Koordinator Program Studi</span>
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}

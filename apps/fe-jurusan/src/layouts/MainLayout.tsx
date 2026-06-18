import { Sidebar } from '@widyatama/ui';
import {
  LayoutDashboard, Target, BookOpen, Layers, ClipboardCheck,
  BarChart3, LogOut, GraduationCap, Eye, Users,
  ChevronDown, Bell, Check, BookMarked, Grid3X3, BookOpenCheck, GitMerge, Shuffle, Scale,
} from 'lucide-react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useAuth, useUser } from '@widyatama/sso-react';
import { useQuery } from '@tanstack/react-query';
import { curriculumService } from '@/services/obe.service';
import { useApp, getStoredCurriculumId } from '@/contexts/AppContext';
import type { Curriculum } from '@/types';

// ─── Sidebar menu ──────────────────────────────────────────────────────────────

const menuGroups = [
  {
    group: 'Umum',
    items: [
      { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard /> },
    ],
  },
  {
    group: 'Profil Program Studi',
    items: [
      { key: 'visi-misi',      label: 'Visi & Misi',    icon: <Eye /> },
      { key: 'profil-lulusan', label: 'Profil Lulusan', icon: <Users /> },
    ],
  },
  {
    group: 'Capaian Pembelajaran',
    items: [
      { key: 'cpl',            label: 'CPL',             icon: <Target /> },
      { key: 'bahan-kajian',   label: 'Bahan Kajian',    icon: <BookOpenCheck /> },
      { key: 'mapping-cpl-pl', label: 'Mapping CPL – PL', icon: <Grid3X3 /> },
      { key: 'mapping-cpl-bk', label: 'Mapping CPL – BK', icon: <GitMerge /> },
      { key: 'mapping-bk-mk', label: 'Mapping BK – MK',  icon: <Shuffle /> },
      { key: 'cpmk',                label: 'CPMK',                icon: <BookOpen /> },
      { key: 'mapping-cpl-cpmk',    label: 'Mapping CPL – CPMK',  icon: <Grid3X3 /> },
      { key: 'mapping-cpl-cpmk-mk', label: 'Mapping CPL–CPMK–MK', icon: <Shuffle /> },
      { key: 'sub-cpmk',            label: 'Mapping & Create Sub CPMK',  icon: <Layers /> },
      { key: 'komponen-penilaian',  label: 'Komponen Penilaian',          icon: <ClipboardCheck /> },
      { key: 'bobot-penilaian',     label: 'Bobot Penilaian CPMK',        icon: <Scale /> },
    ],
  },
];

// ─── Curriculum Dropdown ───────────────────────────────────────────────────────

function CurriculumDropdown() {
  const { studyProgramId, selectedCurriculum, setSelectedCurriculum } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['curricula', 'dropdown', studyProgramId],
    queryFn: () => curriculumService.getAll({
      studyProgramId: studyProgramId ?? undefined,
      isActive: true,
      limit: 100,
      sortBy: 'year',
      sortOrder: 'desc',
    }),
    staleTime: 5 * 60 * 1000,
  });

  const curricula: Curriculum[] = data?.data ?? [];

  useEffect(() => {
    if (selectedCurriculum || curricula.length === 0) return;
    const storedId = getStoredCurriculumId();
    const match = storedId ? curricula.find((c) => c.id === storedId) : null;
    setSelectedCurriculum(match ?? curricula[0] ?? null);
  }, [curricula]); // eslint-disable-line

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const label = selectedCurriculum
    ? `${selectedCurriculum.name} ${selectedCurriculum.year}`
    : isLoading ? 'Memuat...' : 'Pilih Kurikulum';

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold text-gray-800 hover:bg-gray-100 transition-colors group"
      >
        <BookMarked size={16} className="text-primary" />
        <span className="max-w-[240px] truncate">{label}</span>
        <ChevronDown
          size={14}
          className={`text-gray-400 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Pilih Kurikulum</p>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {isLoading && (
              <div className="px-3 py-4 text-xs text-center text-gray-400">Memuat...</div>
            )}
            {!isLoading && curricula.length === 0 && (
              <div className="px-3 py-4 text-xs text-center text-gray-400">Belum ada kurikulum aktif</div>
            )}
            {curricula.map((curriculum) => {
              const isSelected = selectedCurriculum?.id === curriculum.id;
              return (
                <button
                  key={curriculum.id}
                  onClick={() => { setSelectedCurriculum(curriculum); setOpen(false); }}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors
                    ${isSelected ? 'bg-primary/5' : ''}`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{curriculum.name}</p>
                    <p className="text-xs text-gray-400">
                      {curriculum.code} · Kurikulum {curriculum.year} · {curriculum.totalSks} SKS
                    </p>
                  </div>
                  {isSelected && <Check size={14} className="text-primary shrink-0" />}
                </button>
              );
            })}
          </div>
          {selectedCurriculum && (
            <div className="border-t border-gray-100 px-3 py-2">
              <button
                onClick={() => { setSelectedCurriculum(null); setOpen(false); }}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Tampilkan semua kurikulum
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Custom App Header ────────────────────────────────────────────────────────

function AppHeader() {
  const { user } = useUser();
  const { logout } = useAuth();
  const { studyProgramName } = useApp();
  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initials = (user?.name ?? 'U')
    .split(' ')
    .slice(0, 2)
    .map((w: string) => w[0])
    .join('')
    .toUpperCase();

  return (
    <header className="w-full h-16 bg-white shadow-sm border-b flex items-center justify-between px-6 relative shrink-0">
      <div className="flex items-center gap-3">
        {studyProgramName && (
          <span className="text-xs font-medium text-gray-400 border-r border-gray-200 pr-3">
            {studyProgramName}
          </span>
        )}
        <CurriculumDropdown />
      </div>

      <div className="flex items-center gap-3" ref={profileRef}>
        <button className="relative text-gray-500 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
          <Bell size={18} />
          <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-red-500" />
        </button>

        <button
          onClick={() => setShowProfile((p) => !p)}
          className="flex items-center gap-2 text-sm font-medium text-gray-800 hover:bg-gray-100 px-2 py-1.5 rounded-lg transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
            {initials}
          </div>
          <span className="hidden sm:block max-w-[120px] truncate">{user?.name ?? 'Admin'}</span>
          <ChevronDown size={14} className={`text-gray-400 transition-transform ${showProfile ? 'rotate-180' : ''}`} />
        </button>

        {showProfile && (
          <div className="absolute top-14 right-6 bg-white border border-gray-200 rounded-xl shadow-xl w-44 z-50 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-800 truncate">{user?.name ?? 'Admin'}</p>
              <p className="text-[11px] text-gray-400 truncate">{user?.email ?? ''}</p>
            </div>
            <button
              onClick={() => { logout().catch(() => {}); setShowProfile(false); }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut size={14} /> Keluar
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

// ─── Main Layout ───────────────────────────────────────────────────────────────

export default function MainLayout() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { logout } = useAuth();
  const { studyProgramName } = useApp();

  const [activeKey, setActiveKey] = useState(() => {
    const path = location.pathname.replace('/', '');
    return path || 'dashboard';
  });

  const handleMenuClick = (key: string) => {
    setActiveKey(key);
    navigate(`/${key}`);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f9fc]">
      <Sidebar
        title={studyProgramName ? `OBE · ${studyProgramName}` : 'OBE SYSTAMA'}
        titleIcon={<GraduationCap />}
        menu={menuGroups}
        activeKey={activeKey}
        onMenuClick={handleMenuClick}
        showFooter
        footerLabel="Keluar"
        footerIcon={<LogOut />}
        onFooterClick={() => logout().catch(() => {})}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AppHeader />
        <main className="flex-1 p-6 overflow-y-auto scrollbar-hide">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

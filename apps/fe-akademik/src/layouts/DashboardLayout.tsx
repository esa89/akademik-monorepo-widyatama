import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth, useUser } from '@widyatama/sso-react';
import { Sidebar, Topbar } from '@widyatama/ui';
import {
  LayoutDashboard,
  Building2,
  GraduationCap,
  BookOpen,
  BookMarked,
  CalendarDays,
  LogOut,
  Users,
  UserCheck,
  School,
} from 'lucide-react';
import iconWidyatama from '@ui-assets/icon-widyatama.png';

function WidyatamaIcon(_: { size?: number }) {
  return <img src={iconWidyatama} alt="Widyatama" className="w-7 h-7 object-contain" />;
}

const menuGroups = [
  {
    group: 'Menu Utama',
    items: [
      { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard /> },
    ],
  },
  {
    group: 'Akademik',
    items: [
      { key: 'academic-classes', label: 'Kelas Perkuliahan', icon: <School /> },
    ],
  },
  {
    group: 'Master Akademik',
    items: [
      { key: 'faculties', label: 'Fakultas', icon: <Building2 /> },
      { key: 'study-programs', label: 'Program Studi', icon: <GraduationCap /> },
      { key: 'curriculums', label: 'Kurikulum', icon: <BookOpen /> },
      { key: 'courses', label: 'Mata Kuliah', icon: <BookMarked /> },
      { key: 'academic-semesters', label: 'Semester Akademik', icon: <CalendarDays /> },
      { key: 'lecturers', label: 'Dosen', icon: <Users /> },
      { key: 'students', label: 'Mahasiswa', icon: <UserCheck /> },
    ],
  },
];

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const { user } = useUser();
  const [activeKey, setActiveKey] = useState(() => {
    const path = location.pathname.replace('/', '');
    return path || 'dashboard';
  });

  const handleMenuClick = (key: string) => {
    setActiveKey(key);
    navigate(`/${key}`);
  };

  const handleLogout = () => {
    logout().catch(() => {});
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f9fc]">
      <Sidebar
        title="SYSTAMA"
        titleIcon={<WidyatamaIcon />}
        menu={menuGroups}
        activeKey={activeKey}
        onMenuClick={handleMenuClick}
        showFooter
        footerLabel="Keluar"
        footerIcon={<LogOut />}
        onFooterClick={handleLogout}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          userName={user?.name || 'Admin Akademik'}
          profileMenu={[
            { label: 'Profil', onClick: () => {} },
            { label: 'Keluar', onClick: handleLogout },
          ]}
        />
        <main className="flex-1 p-6 overflow-y-auto scrollbar-hide">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

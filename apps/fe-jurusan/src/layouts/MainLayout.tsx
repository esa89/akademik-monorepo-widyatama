import { Sidebar, Topbar } from '@widyatama/ui';
import { LayoutDashboard, Target, BookOpen, Layers, ClipboardCheck, BarChart3, LogOut, GraduationCap } from 'lucide-react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth, useUser } from '@widyatama/sso-react';

const menuGroups = [
  {
    group: 'OBE Management',
    items: [
      { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard /> },
      { key: 'cpl', label: 'CPL', icon: <Target /> },
      { key: 'cpmk', label: 'CPMK', icon: <BookOpen /> },
      { key: 'sub-cpmk', label: 'Sub CPMK', icon: <Layers /> },
      { key: 'assessments', label: 'Assessment', icon: <ClipboardCheck /> },
      { key: 'rubrics', label: 'Rubrik', icon: <BarChart3 /> },
    ],
  },
];

export default function MainLayout() {
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
    <div className="flex min-h-screen bg-[#f8f9fc]">
      <Sidebar
        title="OBE SYSTAMA"
        titleIcon={<GraduationCap />}
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
          userName={user?.name || 'Admin Jurusan'}
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

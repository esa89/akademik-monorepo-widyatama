import { createBrowserRouter, Navigate } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';
import DashboardPage from '@/pages/DashboardPage';
import CplPage from '@/pages/CplPage';
import CpmkPage from '@/pages/CpmkPage';
import SubCpmkPage from '@/pages/SubCpmkPage';
import VisiMisiPage from '@/pages/VisiMisiPage';
import ProfilLulusanPage from '@/pages/ProfilLulusanPage';
import MappingCplPlPage from '@/pages/MappingCplPlPage';
import MappingCplBkPage from '@/pages/MappingCplBkPage';
import MappingBkMkPage from '@/pages/MappingBkMkPage';
import MappingCplCpmkPage from '@/pages/MappingCplCpmkPage';
import MappingCplCpmkMkPage from '@/pages/MappingCplCpmkMkPage';
import BodyOfKnowledgePage from '@/pages/BodyOfKnowledgePage';
import KomponenPenilaianPage from '@/pages/KomponenPenilaianPage';
import BobotPenilaianPage from '@/pages/BobotPenilaianPage';
import TrackingObePage from '@/pages/TrackingObePage';
import TrackingMatakuliahPage from '@/pages/TrackingMatakuliahPage';
import TrackingMahasiswaPage from '@/pages/TrackingMahasiswaPage';
import TrackingCpmkPage from '@/pages/TrackingCpmkPage';
import DistribusiNilaiPage from '@/pages/DistribusiNilaiPage';
import LoginPage from '@/pages/auth/LoginPage';
import CallbackPage from '@/pages/auth/CallbackPage';
import { ProtectedRoute, PublicRoute } from '@/components/auth/ProtectedRoute';

export const router = createBrowserRouter([
  { path: '/login', element: <PublicRoute><LoginPage /></PublicRoute> },
  { path: '/auth/callback', element: <CallbackPage /> },
  {
    path: '/',
    element: <ProtectedRoute><MainLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'visi-misi', element: <VisiMisiPage /> },
      { path: 'profil-lulusan', element: <ProfilLulusanPage /> },
      { path: 'mapping-cpl-pl', element: <MappingCplPlPage /> },
      { path: 'mapping-cpl-bk', element: <MappingCplBkPage /> },
      { path: 'mapping-bk-mk', element: <MappingBkMkPage /> },
      { path: 'cpl', element: <CplPage /> },
      { path: 'bahan-kajian', element: <BodyOfKnowledgePage /> },
      { path: 'cpmk', element: <CpmkPage /> },
      { path: 'mapping-cpl-cpmk', element: <MappingCplCpmkPage /> },
      { path: 'mapping-cpl-cpmk-mk', element: <MappingCplCpmkMkPage /> },
      { path: 'sub-cpmk', element: <SubCpmkPage /> },
      { path: 'komponen-penilaian', element: <KomponenPenilaianPage /> },
      { path: 'bobot-penilaian', element: <BobotPenilaianPage /> },
      { path: 'tracking-obe', element: <TrackingObePage /> },
      { path: 'tracking-matakuliah', element: <TrackingMatakuliahPage /> },
      { path: 'tracking-mahasiswa', element: <TrackingMahasiswaPage /> },
      { path: 'tracking-cpmk',      element: <TrackingCpmkPage /> },
      { path: 'distribusi-nilai', element: <DistribusiNilaiPage /> },
    ],
  },
]);

import React from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import MainLayout from "@/layouts/MainLayout";
import Dashboard from "@/pages/DashboardPage";
import Jadwal from "@/pages/JadwalPage";
import InputKehadiran from "@/pages/kehadiran/InputKehadiranPage";
import InputKehadiranDetail from "@/pages/kehadiran/InputKehadiranDetailPage";
import NilaiKelasPage from "@/pages/nilai/NilaiKelasPage";
import InputNilaiCpmkPage from "@/pages/nilai/InputNilaiCpmkPage";
import PersiapanPage from "@/pages/perkuliahan/PersiapanPage";
import ListMahasiswaTAPage from "@/pages/monitoring-ta/ListMahasiswaTAPage";
import LoginPage from "@/pages/auth/LoginPage";
import CallbackPage from "@/pages/auth/CallbackPage";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@widyatama/sso-react";

function PublicLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (!isLoading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

export const router = createBrowserRouter([
  {
    path: "/login",
    element: (
      <PublicLayout>
        <LoginPage />
      </PublicLayout>
    ),
  },
  {
    path: "/auth/callback",
    element: <CallbackPage />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute requiredRoles={["dosen"]}>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard", element: <Dashboard /> },
      { path: "jadwal", element: <Jadwal /> },
      { path: "kehadiran", element: <InputKehadiran /> },
      { path: "kehadiran/:kode/:pertemuan", element: <InputKehadiranDetail /> },
      { path: "nilai", element: <NilaiKelasPage /> },
      { path: "nilai/:classId", element: <InputNilaiCpmkPage /> },
      { path: "persiapan-kuliah", element: <PersiapanPage /> },
      { path: "monitoring-ta", element: <ListMahasiswaTAPage /> },
    ],
  },
]);

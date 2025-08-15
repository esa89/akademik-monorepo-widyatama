import { createBrowserRouter } from "react-router-dom";
import MainLayout from "@/layouts/MainLayout";
import Dashboard from "@/pages/DashboardPage";
import Jadwal from "@/pages/JadwalPage";
import InputKehadiran from "@/pages/kehadiran/InputKehadiranPage";
import InputKehadiranDetail from "@/pages/kehadiran/InputKehadiranDetailPage";
import LaporanNilai from "@/pages/nilai/LaporanNilaiPage";
import InputNilaiPage from "@/pages/nilai/InputNilaiPage"; // ✅ Tambahan
import PersiapanPage from "@/pages/perkuliahan/PersiapanPage";
import ListMahasiswaTAPage from "@/pages/monitoring-ta/ListMahasiswaTAPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { path: "dashboard", element: <Dashboard /> },
      { path: "jadwal", element: <Jadwal /> },
      { path: "kehadiran", element: <InputKehadiran /> },
      {
        path: "kehadiran/:kode/:pertemuan",
        element: <InputKehadiranDetail />,
      },
      { path: "nilai", element: <LaporanNilai /> },
      { path: "nilai/input/:kode", element: <InputNilaiPage /> }, // ✅ Baru
      { path: "persiapan-kuliah", element: <PersiapanPage /> },
      { path: "monitoring-ta", element: <ListMahasiswaTAPage /> },
    ],
  },
]);

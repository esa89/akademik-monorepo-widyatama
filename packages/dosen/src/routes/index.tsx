// src/routes/index.tsx
import { createBrowserRouter } from "react-router-dom"
import MainLayout from "@/layouts/MainLayout"
import Dashboard from "@/pages/Dashboard"

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { path: "", element: <Dashboard /> },
      // Tambahkan route lain di sini:
      // { path: "jadwal", element: <Jadwal /> },
      // { path: "kehadiran", element: <Kehadiran /> },
    ],
  },
])

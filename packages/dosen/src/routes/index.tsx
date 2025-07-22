// src/routes/index.tsx
import { createBrowserRouter } from "react-router-dom";
import MainLayout from "@/layouts/MainLayout";
import Dashboard from "@/pages/Dashboard";
import Jadwal from "@/pages/Jadwal";
import InputKehadiran from "@/pages/InputKehadiran";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { path: "dashboard", element: <Dashboard /> },
      { path: "jadwal", element: <Jadwal /> },
      { path: "kehadiran", element: <InputKehadiran /> },
    ],
  },
]);

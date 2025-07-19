import { Sidebar as WidyatamaSidebar } from "@widyatama/ui"
import {
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  BookOpen,
  Settings,
  LogOut,
} from "lucide-react"
import { useLocation, useNavigate } from "react-router-dom"

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()

  // key aktif diambil dari path URL saat ini
  const activeKey = location.pathname.split("/")[1] || "dashboard"

  const menu = [
    {
      group: "Perkuliahan",
      items: [
        { key: "dashboard", label: "Dashboard", icon: <LayoutDashboard /> },
        { key: "jadwal", label: "Jadwal", icon: <CalendarDays /> },
        { key: "kehadiran", label: "Kehadiran", icon: <ClipboardList /> },
        { key: "nilai", label: "Nilai", icon: <BookOpen /> },
      ],
    },
    {
      group: "Lainnya",
      items: [
        { key: "pengaturan", label: "Pengaturan", icon: <Settings /> },
      ],
    },
  ]

  const handleMenuClick = (key: string) => {
    navigate(`/${key}`)
  }

  return (
    <WidyatamaSidebar
      title="SYTAMA"
      titleIcon={<LayoutDashboard />}
      menu={menu}
      activeKey={activeKey}
      onMenuClick={handleMenuClick}
      showFooter
      footerLabel="Logout"
      footerIcon={<LogOut />}
      onFooterClick={() => {
        console.log("Logout clicked")
        // Tambahkan logika logout di sini jika perlu
      }}
    />
  )
}

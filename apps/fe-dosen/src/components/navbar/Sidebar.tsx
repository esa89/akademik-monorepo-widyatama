import { Sidebar as WidyatamaSidebar } from "@widyatama/ui"
import {
  LayoutDashboard,
  LogOut,
  ClipboardPen,
} from "lucide-react"
import { useLocation, useNavigate } from "react-router-dom"

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()

  const activeKey = location.pathname.split("/")[1] || "dashboard"

  const menu = [
    {
      group: "Menu",
      items: [
        { key: "dashboard", label: "Dashboard", icon: <LayoutDashboard /> },
        { key: "nilai", label: "Input Nilai", icon: <ClipboardPen /> },
      ],
    },
  ]

  const handleMenuClick = (key: string) => {
    navigate(`/${key}`)
  }

  return (
    <div className="sticky top-0 h-screen">
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
    </div>
  )
}

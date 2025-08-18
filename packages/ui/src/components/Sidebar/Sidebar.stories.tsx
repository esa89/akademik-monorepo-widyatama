import type { Meta, StoryObj } from "@storybook/react";
import { Sidebar } from "./Sidebar";
import {
  BookOpen,
  Home,
  CalendarDays,
  ClipboardList,
  Users,
  BarChart,
  Monitor,
  Settings,
  LogOut,
} from "lucide-react";

const meta: Meta<typeof Sidebar> = {
  title: "Components/Sidebar",
  component: Sidebar,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Sidebar>;

export const Default: Story = {
  args: {
    title: "SYTAMA",
    titleIcon: <BookOpen />,
    activeKey: "jadwal",
    iconSize: 18,
    onMenuClick: (key: string) => console.log("Klik menu:", key),
    menu: [
      {
        group: "Perkuliahan",
        items: [
          { key: "dashboard", label: "Dashboard", icon: <Home /> },
          { key: "jadwal", label: "Jadwal", icon: <CalendarDays /> },
          { key: "kehadiran", label: "Kehadiran", icon: <ClipboardList /> },
          { key: "kelas", label: "Kelas Online", icon: <Users /> },
        ],
      },
      {
        group: "Lainnya",
        items: [
          { key: "persiapan", label: "Persiapan Kuliah", icon: <BarChart /> },
          { key: "ta", label: "Monitoring TA", icon: <Monitor /> },
          { key: "akun", label: "Pengaturan Akun", icon: <Settings /> },
        ],
      },
    ],
    showFooter: true,
    footerLabel: "Keluar",
    footerIcon: <LogOut />,
    onFooterClick: () => alert("Logout diklik"),
  },
};

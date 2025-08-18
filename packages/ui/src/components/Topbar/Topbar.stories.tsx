import type { Meta, StoryObj } from "@storybook/react";
import { Topbar } from "./Topbar";
import { User, BarChart2 } from "lucide-react";

const meta: Meta<typeof Topbar> = {
  component: Topbar,
  title: "Components/Topbar",
  tags: ["autodocs"],
};
export default meta;

type Story = StoryObj<typeof Topbar>;

export const Default: Story = {
  args: {
    userName: "Esa Fauzi",
    avatarUrl: "https://i.pravatar.cc/150?img=3",
    menus: [
      { key: "perkuliahan", label: "Perkuliahan", icon: <User size={18} /> },
      { key: "perwalian", label: "Perwalian", icon: <BarChart2 size={18} /> },
    ],
    activeMenu: "perkuliahan",
    onChangeMenu: (key) => console.log("Menu clicked:", key),
    onNotificationClick: () => alert("Notification clicked"),
    profileMenu: [
      { label: "Profil Saya", onClick: () => alert("Profil Saya") },
      { label: "Logout", onClick: () => alert("Logout") },
    ],
  },
};

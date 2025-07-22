import Header from "@/components/navbar/Header";
import { GraduationCap, UserCheck, User2 } from "lucide-react";
import { useState } from "react";
import Sidebar from "@/components/navbar/Sidebar";
import { Outlet } from "react-router-dom";
import RightSidebar from "@/components/navbar/RightSidebar";

export default function MainLayout() {
  const [tab, setTab] = useState("perkuliahan");

  const tabs = [
    { key: "perkuliahan", label: "Perkuliahan", icon: <GraduationCap className="w-4 h-4" /> },
    { key: "perwalian", label: "Perwalian", icon: <UserCheck className="w-4 h-4" /> },
  ];

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header
          tabs={tabs}
          currentTab={tab}
          onTabChange={setTab}
          user={{
            name: "Esa Fauzi",
            icon: <User2 className="w-6 h-6 text-gray-700" />,
          }}
        />
        <div className="p-6 flex-1 overflow-y-auto h-[calc(100vh-4rem)] scrollbar-hide">
          <Outlet />
        </div>
      </div>
      <div className="hidden lg:block">
        <RightSidebar />
      </div>
    </div>
  );
}

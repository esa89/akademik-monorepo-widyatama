import Header from "@/components/navbar/Header";
import Sidebar from "@/components/navbar/Sidebar";
import { Outlet } from "react-router-dom";

export default function MainLayout() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <div className="p-6 flex-1 overflow-y-auto h-[calc(100vh-4rem)] scrollbar-hide">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

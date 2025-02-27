
import { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import { Sidebar } from "./Sidebar";

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-background">
      <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex h-[calc(100vh-4rem)]">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className={`flex-1 overflow-y-auto p-6 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

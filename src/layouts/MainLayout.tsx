
import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

interface MainLayoutProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export function MainLayout({ sidebarOpen, setSidebarOpen }: MainLayoutProps) {
  const isMobile = useIsMobile();
  
  // Close sidebar by default on mobile devices
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }
  }, [isMobile, setSidebarOpen]);

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-[calc(100vh)]">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className={`flex-1 overflow-y-auto p-4 md:p-6 transition-all duration-300 ${sidebarOpen && !isMobile ? 'ml-64' : 'ml-0'}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Header } from "./shared/components/layout/Header";
import { Sidebar } from "./shared/components/layout/Sidebar";

export function AppLayout() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#0B1120]">
      <Sidebar open={isMobileOpen} onClose={() => setIsMobileOpen(false)} />

      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
        <Header onMenuClick={() => setIsMobileOpen(true)} />

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

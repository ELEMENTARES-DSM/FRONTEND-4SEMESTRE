import { useCallback, useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Header } from "./shared/components/layout/Header";
import { Sidebar } from "./shared/components/layout/Sidebar";
import { Toast, type Notificacao } from "./shared/components/Toast";

export function AppLayout() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { pathname, search, state } = useLocation();
  const navigate = useNavigate();

  const denied = (state as { denied?: boolean } | null)?.denied === true;
  const deniedNotice = useMemo<Notificacao | null>(
    () =>
      denied
        ? { id: 1, message: "Acesso negado. Seu perfil não tem permissão para acessar essa página.", type: "error" }
        : null,
    [denied],
  );
  const closeDenied = useCallback(
    () => navigate(pathname + search, { replace: true, state: null }),
    [navigate, pathname, search],
  );

  return (
    <div className="flex h-screen w-full overflow-hidden bg-base-100">
      <Toast notification={deniedNotice} onClose={closeDenied} />
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

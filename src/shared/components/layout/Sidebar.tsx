import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  DEFAULT_SYSTEM_STATUS,
  type SidebarNavItem,
  type SidebarSystemStatus,
  type SidebarUserInfo,
} from './layoutConstants';
import { NAV } from './navItems';
import { useAuthorization } from '../../../auth/useAuthorization';
import { useAuth } from '../../../auth/useAuth';

const ROLE_LABELS: Record<string, string> = {
  ADMINISTRADOR: 'Administrador',
  GESTOR_PUBLICO: 'Gestor Público',
  PESQUISADOR: 'Pesquisador',
};

export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
      aria-hidden="true"
    >
      <rect
        width="28"
        height="28"
        rx="7"
        className="fill-primary/15 stroke-primary"
        strokeWidth="1.2"
      />
      <path
        d="M5 14.5h4.5l2.5-6 3.5 11 3-6.5h4.5"
        className="stroke-secondary"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
  items?: SidebarNavItem[];
  user?: SidebarUserInfo;
  systemStatus?: SidebarSystemStatus;
  logo?: React.ReactNode;
  className?: string;
}

export function Sidebar({
  open = false,
  onClose,
  items = NAV,
  user,
  systemStatus = DEFAULT_SYSTEM_STATUS,
  logo,
  className = '',
}: SidebarProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { hasPermission } = useAuthorization();
  const { usuario, logout } = useAuth();
  const [recolhida, setRecolhida] = useState(false);
  const [saindo, setSaindo] = useState(false);
  const [erroLogout, setErroLogout] = useState<string | null>(null);
  const currentUser: SidebarUserInfo | undefined = usuario
    ? { name: usuario.nome, role: ROLE_LABELS[usuario.papel] ?? usuario.papel }
    : user;
  const visibleItems = items.filter((item) =>
    (!item.permission || hasPermission(item.permission)) &&
    (item.path !== '/platform/usuarios' || usuario?.papel === 'ADMINISTRADOR')
  );

  const handleLogout = async () => {
    if (saindo) return;
    setSaindo(true);
    setErroLogout(null);
    try {
      await logout();
      onClose?.();
    } catch (error) {
      setErroLogout(error instanceof Error ? error.message : 'Não foi possível sair. Tente novamente.');
    } finally {
      setSaindo(false);
    }
  };

  const isItemActive = (item: SidebarNavItem) => {
    if (item.path === '/platform') {
      return pathname === '/platform';
    }
    if (item.path === '/stations') {
      return (
        pathname.startsWith('/stations') ||
        pathname.startsWith('/platform/territory')
      );
    }
    return pathname.startsWith(item.path);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose?.();
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          data-testid="sidebar-overlay"
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-[1px] md:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed md:relative z-40 md:z-auto flex flex-col h-full w-[220px] min-w-[220px] shrink-0 bg-base-100 border-r border-base-300 transition-[width,min-width,transform] duration-200 ease-in-out md:translate-x-0 ${recolhida ? 'md:w-[72px] md:min-w-[72px]' : ''} ${open ? 'translate-x-0' : '-translate-x-full'
          } ${className}`}
        aria-label="Navegação Lateral"
      >
        {/* Logo */}
        <div
          className={`flex items-center gap-2.5 px-4 h-14 shrink-0 cursor-pointer select-none border-b border-base-300 ${recolhida ? 'md:justify-center md:px-2' : ''}`}
          onClick={() => handleNavigate('/platform')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              handleNavigate('/platform');
            }
          }}
          aria-label="Ir para a página inicial"
        >
          {logo ?? <LogoMark size={28} />}
          <div className={recolhida ? 'md:hidden' : undefined}>
            <div className="text-sm font-bold tracking-[0.06em] leading-none text-white">
              PULSO
            </div>
            <div className="text-sm font-light tracking-[0.16em] leading-none mt-px text-white">
              URBANO
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setRecolhida((value) => !value)}
          aria-label={recolhida ? 'Expandir sidebar' : 'Recolher sidebar'}
          title={recolhida ? 'Expandir sidebar' : 'Recolher sidebar'}
          aria-expanded={!recolhida}
          className={`
    hidden md:flex
    w-full
    items-center
    border-t border-base-300
    text-muted
    transition-colors duration-200
    hover:bg-base-200
    hover:text-base-content
    ${recolhida
              ? 'h-12 justify-center px-0'
              : 'h-12 gap-3 px-4'
            }
  `}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="shrink-0"
          >
            <rect x="3" y="4" width="18" height="16" rx="2" />

            <path
              d={recolhida ? 'm10 8 4 4-4 4' : 'm14 8-4 4 4 4'}
            />
          </svg>

          {!recolhida && (
            <span className="text-sm">
              Recolher menu
            </span>
          )}
        </button>

        {/* Navigation items */}
        <nav
          className={`flex-1 px-3 py-4 space-y-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${recolhida ? 'md:px-2' : ''}`}
          role="navigation"
        >
          {visibleItems.map((item) => {
            const active = isItemActive(item);
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => handleNavigate(item.path)}
                aria-current={active ? 'page' : undefined}
                aria-label={item.label}
                title={recolhida ? item.label : undefined}
                className={`relative w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-left transition-all group border ${recolhida ? 'md:justify-center md:px-2' : ''} ${active
                  ? 'bg-secondary/10 text-secondary border-secondary/20'
                  : 'bg-transparent text-muted border-transparent'
                  }`}
              >
                <span
                  className={`shrink-0 transition-colors ${active ? 'text-secondary' : 'text-muted'
                    }`}
                >
                  {item.icon}
                </span>
                <span className={`flex-1 font-medium ${recolhida ? 'md:hidden' : ''}`}>{item.label}</span>
                {item.badge !== undefined && item.badge !== null && (
                  <span className={`text-[10px] font-bold px-1.5 h-4 min-w-4 rounded-full flex items-center justify-center shrink-0 bg-error text-white ${recolhida ? 'md:absolute md:right-0 md:top-0' : ''}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom status & User profile */}
        <div className={`px-4 py-4 shrink-0 space-y-3 border-t border-base-300 ${recolhida ? 'md:px-2' : ''}`}>
          <div className={`flex items-center gap-2 ${recolhida ? 'md:justify-center' : ''}`} title={systemStatus.label}>
            <div
              className={`w-2 h-2 rounded-full shrink-0 ${systemStatus.online
                ? 'bg-success shadow-[0_0_5px_var(--color-success)]'
                : 'bg-error shadow-[0_0_5px_var(--color-error)]'
                }`}
            />
            <span className={`text-[11px] text-muted ${recolhida ? 'md:hidden' : ''}`}>
              {systemStatus.label}
            </span>
          </div>

          {currentUser && <div className={`flex items-center gap-2.5 ${recolhida ? 'md:hidden' : ''}`}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 select-none bg-secondary/15 text-secondary border border-secondary/25">
              {currentUser.avatarInitials ??
                currentUser.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium truncate text-base-content">
                {currentUser.name}
              </div>
              <div className="text-[10px] truncate text-muted">
                {currentUser.role}
              </div>
            </div>
          </div>}
          {usuario && (
            <button
              type="button"
              onClick={() => void handleLogout()}
              disabled={saindo}
              aria-label={saindo ? 'Saindo...' : 'Sair'}
              title={recolhida ? (saindo ? 'Saindo...' : 'Sair') : undefined}
              className={`flex items-center gap-2.5 w-full rounded-lg border border-base-300 px-3 py-2 text-left text-sm text-muted transition-colors hover:bg-base-200 hover:text-base-content disabled:opacity-50 ${recolhida ? 'md:justify-center md:px-2' : ''}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" aria-hidden="true">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
              <span className={recolhida ? 'md:hidden' : undefined}>{saindo ? 'Saindo...' : 'Sair'}</span>
            </button>
          )}
          {erroLogout && <p role="alert" className="text-xs text-error">{erroLogout}</p>}
        </div>
      </aside>
    </>
  );
}

export default Sidebar;

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  DEFAULT_SYSTEM_STATUS,
  DEFAULT_USER,
  type SidebarNavItem,
  type SidebarSystemStatus,
  type SidebarUserInfo,
} from './layoutConstants';
import { NAV } from './navItems';

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
  user = DEFAULT_USER,
  systemStatus = DEFAULT_SYSTEM_STATUS,
  logo,
  className = '',
}: SidebarProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

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
        className={`fixed md:relative z-40 md:z-auto flex flex-col h-full w-[220px] min-w-[220px] bg-base-100 border-r border-base-300 transition-transform duration-200 ease-in-out md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        } ${className}`}
        aria-label="Navegação Lateral"
      >
        {/* Logo */}
        <div
          className="flex items-center gap-2.5 px-4 h-14 shrink-0 cursor-pointer select-none border-b border-base-300"
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
          <div>
            <div className="text-sm font-bold tracking-[0.06em] leading-none text-white">
              PULSO
            </div>
            <div className="text-sm font-light tracking-[0.16em] leading-none mt-px text-white">
              URBANO
            </div>
          </div>
        </div>

        {/* Navigation items */}
        <nav
          className="flex-1 px-3 py-4 space-y-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          role="navigation"
        >
          {items.map((item) => {
            const active = isItemActive(item);
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => handleNavigate(item.path)}
                aria-current={active ? 'page' : undefined}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-left transition-all group border ${
                  active
                    ? 'bg-secondary/10 text-secondary border-secondary/20'
                    : 'bg-transparent text-muted border-transparent'
                }`}
              >
                <span
                  className={`shrink-0 transition-colors ${
                    active ? 'text-secondary' : 'text-muted'
                  }`}
                >
                  {item.icon}
                </span>
                <span className="flex-1 font-medium">{item.label}</span>
                {item.badge !== undefined && item.badge !== null && (
                  <span className="text-[10px] font-bold px-1.5 h-4 min-w-4 rounded-full flex items-center justify-center shrink-0 bg-error text-white">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom status & User profile */}
        <div className="px-4 py-4 shrink-0 space-y-3 border-t border-base-300">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full shrink-0 ${
                systemStatus.online
                  ? 'bg-success shadow-[0_0_5px_var(--color-success)]'
                  : 'bg-error shadow-[0_0_5px_var(--color-error)]'
              }`}
            />
            <span className="text-[11px] text-muted">
              {systemStatus.label}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 select-none bg-secondary/15 text-secondary border border-secondary/25">
              {user.avatarInitials ??
                user.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium truncate text-base-content">
                {user.name}
              </div>
              <div className="text-[10px] truncate text-muted">
                {user.affiliation ?? user.role}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
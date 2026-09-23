import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  C,
  DEFAULT_SYSTEM_STATUS,
  DEFAULT_USER,
  type SidebarNavItem,
  type SidebarSystemStatus,
  type SidebarUserInfo,
} from './layoutConstants';
import { NAV } from './navItems';

/**
 * Ícone SVG do logo da aplicação Pulso Urbano
 */
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
        fill="#00A6E6"
        fillOpacity="0.15"
        stroke="#00A6E6"
        strokeWidth="1.2"
      />
      <path
        d="M5 14.5h4.5l2.5-6 3.5 11 3-6.5h4.5"
        stroke="#22B8B5"
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
        className={`fixed md:relative z-40 md:z-auto flex flex-col h-full transition-transform duration-200 ease-in-out md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        } ${className}`}
        style={{
          width: 220,
          minWidth: 220,
          background: C.navy950,
          borderRight: `1px solid ${C.navy700}`,
        }}
        aria-label="Navegação Lateral"
      >
        {/* Logo */}
        <div
          className="flex items-center gap-2.5 px-4 h-14 shrink-0 cursor-pointer select-none"
          style={{ borderBottom: `1px solid ${C.navy700}` }}
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
            <div
              className="text-sm font-bold tracking-[0.06em] leading-none"
              style={{ color: '#ffffff' }}
            >
              PULSO
            </div>
            <div
              className="text-sm font-light tracking-[0.16em] leading-none mt-px"
              style={{ color: '#ffffff' }}
            >
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
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-left transition-all group"
                style={{
                  background: active ? `${C.teal500}18` : 'transparent',
                  color: active ? C.teal500 : C.slate400,
                  border: `1px solid ${active ? `${C.teal500}33` : 'transparent'}`,
                }}
              >
                <span
                  className="shrink-0 transition-colors"
                  style={{ color: active ? C.teal500 : C.navy500 }}
                >
                  {item.icon}
                </span>
                <span className="flex-1 font-medium">{item.label}</span>
                {item.badge !== undefined && item.badge !== null && (
                  <span
                    className="text-[10px] font-bold px-1.5 h-4 min-w-4 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: C.red500, color: '#ffffff' }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom status & User profile */}
        <div
          className="px-4 py-4 shrink-0 space-y-3"
          style={{ borderTop: `1px solid ${C.navy700}` }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{
                background: systemStatus.online ? C.green500 : C.red500,
                boxShadow: `0 0 5px ${systemStatus.online ? C.green500 : C.red500}`,
              }}
            />
            <span className="text-[11px]" style={{ color: C.slate400 }}>
              {systemStatus.label}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 select-none"
              style={{
                background: `${C.teal500}22`,
                color: C.teal500,
                border: `1px solid ${C.teal500}44`,
              }}
            >
              {user.avatarInitials ??
                user.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div
                className="text-xs font-medium truncate"
                style={{ color: C.slate200 }}
              >
                {user.name}
              </div>
              <div
                className="text-[10px] truncate"
                style={{ color: C.slate400 }}
              >
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
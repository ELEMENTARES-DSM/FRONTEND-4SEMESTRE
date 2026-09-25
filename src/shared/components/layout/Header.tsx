import { useState } from "react";
import { useLocation } from "react-router-dom";
import { NAV } from "./navItems";

export interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const [search, setSearch] = useState("");
  const { pathname } = useLocation();

  const current = NAV.find((n) =>
    n.path === "/platform"
      ? pathname === "/platform" || pathname === "/"
      : pathname.startsWith(n.path),
  );

  return (
    <header className="flex items-center gap-3 px-4 h-14 shrink-0 bg-base-200 border-b border-base-300">
      {/* Mobile menu */}
      <button
        type="button"
        className="md:hidden p-1.5 rounded hover:bg-white/5 transition-colors text-muted"
        onClick={onMenuClick}
        aria-label="Abrir menu lateral"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        >
          <path d="M2 5h14M2 9h14M2 13h14" />
        </svg>
      </button>

      {/* Page title */}
      <div className="hidden md:flex items-center gap-2">
        <span className="text-xs text-muted">Pulso Urbano</span>
        <span className="text-line">/</span>
        <span className="text-sm font-medium text-base-content">
          {current?.label ?? "—"}
        </span>
      </div>

      <div className="flex-1" />

      {/* Period picker */}
      <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs cursor-pointer hover:opacity-90 bg-base-300 text-base-content border border-line">
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          className="text-muted"
          strokeWidth="1.3"
        >
          <rect x="1" y="2" width="10" height="9" rx="1" />
          <path d="M1 5h10M4 1v2M8 1v2" strokeLinecap="round" />
        </svg>
        01/05 – 31/05
      </div>

      {/* Region */}
      <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs cursor-pointer hover:opacity-90 bg-base-300 text-base-content border border-line">
        Todas as regiões ▾
      </div>
    </header>
  );
}

export default Header;

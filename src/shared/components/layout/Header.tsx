import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { C } from './layoutConstants';
import { NAV } from './navItems';

export interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const [search, setSearch] = useState('');
  const { pathname } = useLocation();

  const current = NAV.find((n) =>
    n.path === '/platform'
      ? pathname === '/platform' || pathname === '/'
      : pathname.startsWith(n.path),
  );

  return (
    <header
      className="flex items-center gap-3 px-4 h-14 shrink-0"
      style={{ background: C.navy800, borderBottom: `1px solid ${C.navy700}` }}
    >
      {/* Mobile menu */}
      <button
        type="button"
        className="md:hidden p-1.5 rounded hover:bg-white/5 transition-colors"
        onClick={onMenuClick}
        aria-label="Abrir menu lateral"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          stroke={C.slate400}
          strokeWidth="1.5"
          strokeLinecap="round"
        >
          <path d="M2 5h14M2 9h14M2 13h14" />
        </svg>
      </button>

      {/* Page title */}
      <div className="hidden md:flex items-center gap-2">
        <span className="text-xs" style={{ color: C.navy500 }}>
          Pulso Urbano
        </span>
        <span style={{ color: C.navy600 }}>/</span>
        <span className="text-sm font-medium" style={{ color: C.slate200 }}>
          {current?.label ?? '—'}
        </span>
      </div>

      <div className="flex-1" />

      {/* Search */}
      <div className="relative hidden sm:block">
        <svg
          className="absolute left-2.5 top-1/2 -translate-y-1/2"
          width="13"
          height="13"
          viewBox="0 0 13 13"
          fill="none"
          stroke={C.navy500}
          strokeWidth="1.5"
        >
          <circle cx="5.5" cy="5.5" r="4" />
          <path d="M9 9l3 3" strokeLinecap="round" />
        </svg>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar região, indicador…"
          className="pl-8 pr-3 py-1.5 rounded-lg text-xs w-52 outline-none"
          style={{
            background: C.navy700,
            color: C.slate200,
            border: `1px solid ${C.navy600}`,
            caretColor: C.teal500,
          }}
        />
      </div>

      {/* Period picker */}
      <div
        className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs cursor-pointer hover:opacity-90"
        style={{
          background: C.navy700,
          color: C.slate300,
          border: `1px solid ${C.navy600}`,
        }}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          stroke={C.slate400}
          strokeWidth="1.3"
        >
          <rect x="1" y="2" width="10" height="9" rx="1" />
          <path d="M1 5h10M4 1v2M8 1v2" strokeLinecap="round" />
        </svg>
        01/05 – 31/05
      </div>

      {/* Region */}
      <div
        className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs cursor-pointer hover:opacity-90"
        style={{
          background: C.navy700,
          color: C.slate300,
          border: `1px solid ${C.navy600}`,
        }}
      >
        Todas as regiões ▾
      </div>

      {/* Status */}
      <div
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
        style={{
          background: `${C.green500}14`,
          border: `1px solid ${C.green500}33`,
        }}
      >
        <div
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: C.green500, boxShadow: `0 0 4px ${C.green500}` }}
        />
        <span
          className="text-[10px] hidden sm:block"
          style={{ color: C.green500 }}
        >
          Ao vivo
        </span>
      </div>

      {/* Alert count */}
      <div className="relative">
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          stroke={C.slate400}
          strokeWidth="1.4"
        >
          <path d="M9 2L1 16h16z" strokeLinecap="round" />
          <path d="M9 8v3M9 12.5v.5" strokeLinecap="round" />
        </svg>

        <span
          className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold"
          style={{ background: C.red500, color: '#fff' }}
        >
          3
        </span>
      </div>
    </header>
  );
}

export default Header;

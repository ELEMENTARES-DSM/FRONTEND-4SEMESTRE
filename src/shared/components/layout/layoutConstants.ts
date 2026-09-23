import type { ReactNode } from 'react';

/**
 * Paleta de cores do layout e tema escuro (Pulso Urbano)
 */
export const C = {
  navy950: '#071426',
  navy800: '#0d1d33',
  navy700: '#11243d',
  navy600: '#203752',
  navy500: '#334e68',
  slate400: '#94a3b8',
  slate300: '#cbd5e1',
  slate200: '#e2e8f0',
  teal500: '#22b8b5',
  green500: '#8cdd2d',
  red500: '#f05252',
} as const;

export interface SidebarNavItem {
  path: string;
  label: string;
  icon: ReactNode;
  badge?: string | number;
}

export interface SidebarUserInfo {
  name: string;
  role?: string;
  affiliation?: string;
  avatarInitials?: string;
}

export interface SidebarSystemStatus {
  label: string;
  online?: boolean;
}

export const DEFAULT_USER: SidebarUserInfo = {
  name: 'Pesquisador',
  role: 'Pesquisador',
  affiliation: 'INMET / USP',
  avatarInitials: 'PS',
};

export const DEFAULT_SYSTEM_STATUS: SidebarSystemStatus = {
  label: 'Sistema operacional',
  online: true,
};

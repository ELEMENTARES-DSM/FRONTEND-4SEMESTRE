import type { ReactNode } from 'react';


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

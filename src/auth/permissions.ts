export type Role = 'ADMINISTRADOR' | 'GESTOR_PUBLICO' | 'PESQUISADOR' | 'MUNICIPE'

export type Permission =
  | 'territory.access'
  | 'stations.view'
  | 'stations.create'
  | 'stations.toggle-status'
  | 'alerts.manage'
  | 'alarms.view'
  | 'grandezas.view'
  | 'grandezas.manage'

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  ADMINISTRADOR: [
    'territory.access',
    'stations.view',
    'stations.create',
    'stations.toggle-status',
    'alerts.manage',
    'alarms.view',
    'grandezas.view',
    'grandezas.manage',
  ],
  GESTOR_PUBLICO: [
    'territory.access',
    'stations.view',
    'stations.create',
    'stations.toggle-status',
    'alerts.manage',
    'alarms.view',
    'grandezas.view',
  ],
  PESQUISADOR: [],
  MUNICIPE: [],
}

export function getPermissionsForRole(papel?: string | null): readonly Permission[] {
  if (!papel) return []
  return ROLE_PERMISSIONS[papel as Role] ?? []
}

export function roleHasPermission(
  papel: string | null | undefined,
  permission: Permission,
): boolean {
  if (!papel) return false
  const permissions = getPermissionsForRole(papel)
  return permissions.includes(permission)
}

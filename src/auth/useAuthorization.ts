import { useContext, useMemo } from 'react'
import { AuthContext } from './AuthContext'
import { readStoredSession, type Usuario } from './session'
import {
  roleHasPermission,
  type Permission,
  type Role,
} from './permissions'

export interface UseAuthorizationReturn {
  usuario: Usuario | null
  papel: Role | null
  hasPermission: (permission: Permission) => boolean
  hasRole: (roles: Role | Role[]) => boolean
  canAccessTerritory: boolean
  canViewStations: boolean
  canCreateStation: boolean
  canToggleStation: boolean
}

export function useAuthorization(): UseAuthorizationReturn {
  const authContext = useContext(AuthContext)

  const usuario = useMemo<Usuario | null>(
    () => authContext?.usuario ?? readStoredSession()?.usuario ?? null,
    [authContext],
  )

  const papel = (usuario?.papel as Role) ?? null

  const hasPermission = useMemo(() => {
    return (permission: Permission): boolean => {
      return roleHasPermission(papel, permission)
    }
  }, [papel])

  const hasRole = useMemo(() => {
    return (roles: Role | Role[]): boolean => {
      if (!papel) return false
      const list = Array.isArray(roles) ? roles : [roles]
      return list.includes(papel)
    }
  }, [papel])

  return {
    usuario,
    papel,
    hasPermission,
    hasRole,
    canAccessTerritory: hasPermission('territory.access'),
    canViewStations: hasPermission('stations.view'),
    canCreateStation: hasPermission('stations.create'),
    canToggleStation: hasPermission('stations.toggle-status'),
  }
}

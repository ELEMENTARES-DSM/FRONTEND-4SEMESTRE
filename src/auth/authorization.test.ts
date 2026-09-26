import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import {
  ROLE_PERMISSIONS,
  getPermissionsForRole,
  roleHasPermission,
} from './permissions'
import { useAuthorization } from './useAuthorization'

describe('Camada de Autorização e Permissões (permissions.ts)', () => {
  it('ADMINISTRADOR possui todas as permissões para o território e estações', () => {
    expect(ROLE_PERMISSIONS.ADMINISTRADOR).toContain('territory.access')
    expect(ROLE_PERMISSIONS.ADMINISTRADOR).toContain('stations.view')
    expect(ROLE_PERMISSIONS.ADMINISTRADOR).toContain('stations.create')
    expect(ROLE_PERMISSIONS.ADMINISTRADOR).toContain('stations.toggle-status')
  })

  it('GESTOR_PUBLICO possui permissões explicitamente configuradas', () => {
    expect(ROLE_PERMISSIONS.GESTOR_PUBLICO).toContain('territory.access')
    expect(ROLE_PERMISSIONS.GESTOR_PUBLICO).toContain('stations.view')
    expect(ROLE_PERMISSIONS.GESTOR_PUBLICO).toContain('stations.create')
    expect(ROLE_PERMISSIONS.GESTOR_PUBLICO).toContain('stations.toggle-status')
  })

  it('PESQUISADOR não possui nenhuma permissão administrativa de território', () => {
    expect(ROLE_PERMISSIONS.PESQUISADOR).toHaveLength(0)
    expect(roleHasPermission('PESQUISADOR', 'territory.access')).toBe(false)
    expect(roleHasPermission('PESQUISADOR', 'stations.view')).toBe(false)
    expect(roleHasPermission('PESQUISADOR', 'stations.create')).toBe(false)
    expect(roleHasPermission('PESQUISADOR', 'stations.toggle-status')).toBe(false)
  })

  it('roleHasPermission retorna false para papéis nulos, indefinidos ou desconhecidos', () => {
    expect(roleHasPermission(null, 'stations.view')).toBe(false)
    expect(roleHasPermission(undefined, 'stations.view')).toBe(false)
    expect(roleHasPermission('PAPEL_INEXISTENTE', 'stations.view')).toBe(false)
  })

  it('getPermissionsForRole retorna lista vazia quando o papel não é informado', () => {
    expect(getPermissionsForRole(null)).toEqual([])
    expect(getPermissionsForRole(undefined)).toEqual([])
  })
})

describe('Hook useAuthorization', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('retorna permissões completas para ADMINISTRADOR', () => {
    localStorage.setItem('userRole', 'ADMINISTRADOR')

    const { result } = renderHook(() => useAuthorization())

    expect(result.current.papel).toBe('ADMINISTRADOR')
    expect(result.current.canAccessTerritory).toBe(true)
    expect(result.current.canViewStations).toBe(true)
    expect(result.current.canCreateStation).toBe(true)
    expect(result.current.canToggleStation).toBe(true)
    expect(result.current.hasRole('ADMINISTRADOR')).toBe(true)
    expect(result.current.hasRole(['ADMINISTRADOR', 'GESTOR_PUBLICO'])).toBe(true)
    expect(result.current.hasRole('PESQUISADOR')).toBe(false)
  })

  it('retorna bloqueio total para PESQUISADOR', () => {
    localStorage.setItem('userRole', 'PESQUISADOR')

    const { result } = renderHook(() => useAuthorization())

    expect(result.current.papel).toBe('PESQUISADOR')
    expect(result.current.canAccessTerritory).toBe(false)
    expect(result.current.canViewStations).toBe(false)
    expect(result.current.canCreateStation).toBe(false)
    expect(result.current.canToggleStation).toBe(false)
    expect(result.current.hasPermission('stations.view')).toBe(false)
  })

  it('retorna bloqueio para usuário não autenticado / sem papel', () => {
    const { result } = renderHook(() => useAuthorization())

    expect(result.current.papel).toBeNull()
    expect(result.current.canAccessTerritory).toBe(false)
    expect(result.current.canViewStations).toBe(false)
    expect(result.current.canCreateStation).toBe(false)
    expect(result.current.canToggleStation).toBe(false)
  })
})

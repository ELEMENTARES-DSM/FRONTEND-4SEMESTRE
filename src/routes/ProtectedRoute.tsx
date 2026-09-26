import { useContext } from 'react'
import type { ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { AuthContext } from '../auth/AuthContext'
import { devAuthBypass, getValidToken } from '../auth/session'
import { useAuthorization } from '../auth/useAuthorization'
import type { Permission, Role } from '../auth/permissions'

export interface ProtectedRouteProps {
  children?: ReactNode
  allowedRoles?: Role[]
  requiredPermission?: Permission
  fallbackPath?: string
}

export function ProtectedRoute({
  children,
  allowedRoles,
  requiredPermission,
  fallbackPath = '/platform',
}: ProtectedRouteProps = {}) {
  const authContext = useContext(AuthContext)
  const token = authContext?.token ?? getValidToken()
  const location = useLocation()
  const { papel, hasPermission, hasRole } = useAuthorization()

  const isAuthenticated = devAuthBypass || (token && token === getValidToken())

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to={fallbackPath} replace state={{ denied: true }} />
  }

  if (allowedRoles && allowedRoles.length > 0 && (!papel || !hasRole(allowedRoles))) {
    return <Navigate to={fallbackPath} replace state={{ denied: true }} />
  }

  return children ? <>{children}</> : <Outlet />
}


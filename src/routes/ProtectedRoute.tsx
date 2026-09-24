import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { devAuthBypass, getValidToken } from '../auth/session'

export function ProtectedRoute() {
  const { token } = useAuth()
  const location = useLocation()

  if (devAuthBypass || (token && token === getValidToken())) return <Outlet />

  return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
}

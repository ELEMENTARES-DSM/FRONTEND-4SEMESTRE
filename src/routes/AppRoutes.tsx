import { Navigate, Route, Routes } from 'react-router-dom'
import { Platform } from '../pages/platform/Platform'
import { StationDetails } from '../pages/StationDetail/StationDetail'
import DevLib from '../pages/DevLib'
import { Login } from '../pages/Login/Login'
import { ProtectedRoute } from './ProtectedRoute'
import { Usuarios } from '../pages/Usuarios/Usuarios'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/platform" replace />} />
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/platform" element={<Platform />} />
        <Route path="/platform/usuarios" element={<Usuarios />} />
        <Route path="/platform/estacoes/:estacaoId" element={<StationDetails />} />
      </Route>
      <Route path="/devlib" element={<DevLib />} />
    </Routes>
  )
}

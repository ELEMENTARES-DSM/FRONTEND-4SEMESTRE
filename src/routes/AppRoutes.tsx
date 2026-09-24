import { Navigate, Route, Routes } from 'react-router-dom'
import { Platform } from '../pages/Platform/Platform'
import DevLib from '../pages/DevLib'
import { Login } from '../pages/Login/Login'
import { ProtectedRoute } from './ProtectedRoute'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/platform" replace />} />
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
      <Route path="/platform" element={<Platform />} />
      </Route>
      
      {/* <Route path="/" element={<ComponentShowcase />} /> */}
      <Route path="/devlib" element={<DevLib />} />
    </Routes>
  )
}
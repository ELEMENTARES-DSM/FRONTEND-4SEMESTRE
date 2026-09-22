import { Route, Routes } from 'react-router-dom'
import { Platform } from '../pages/Platform/Platform'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/platform" element={<Platform />} />
    </Routes>
  )
}
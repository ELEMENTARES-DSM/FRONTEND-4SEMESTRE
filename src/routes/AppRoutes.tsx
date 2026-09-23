import { Route, Routes } from 'react-router-dom'
import { Platform } from '../pages/Platform/Platform'
import DevLib from '../pages/DevLib'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/platform" element={<Platform />} />
      {/* <Route path="/" element={<ComponentShowcase />} /> */}
      <Route path="/devlib" element={<DevLib />} />
    </Routes>
  )
}
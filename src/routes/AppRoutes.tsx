import { Route, Routes } from 'react-router-dom'
import DevLib from '../pages/DevLib'
import { Platform } from '../pages/Platform/Platform'

export function AppRoutes() {
  return (
    <Routes>
      {/* <Route path="/" element={<ComponentShowcase />} /> */}
      <Route path="/devlib" element={<DevLib />} />
      <Route path="/monitoramento-estacao" element={<Platform />} />
      <Route path="/platform" element={<Platform />} />
    </Routes>
  )
}
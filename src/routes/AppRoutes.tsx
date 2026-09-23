import { Route, Routes } from 'react-router-dom'
import { Stations } from '../pages/Stations'
import { Platform } from '../pages/Platform/Platform'
import DevLib from '../pages/DevLib'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Stations />} />
      <Route path="/platform/territory" element={<Stations />} />
      <Route path="/platform" element={<Platform />} />
      {/* <Route path="/" element={<ComponentShowcase />} /> */}
      <Route path="/devlib" element={<DevLib />} />
    </Routes>
  )
}
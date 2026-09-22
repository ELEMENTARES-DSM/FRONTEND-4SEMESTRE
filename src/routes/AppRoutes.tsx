import { Route, Routes } from 'react-router-dom'
import { Stations } from '../pages/Stations'
import DevLib from '../pages/DevLib'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Stations />} />
      <Route path="/platform/territory" element={<Stations />} />
      <Route path="/devlib" element={<DevLib />} />
    </Routes>
  )
}
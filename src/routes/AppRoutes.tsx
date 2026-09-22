import { Route, Route, Routes } from 'react-router-dom'
import DevLib from '../pages/DevLib'
import { Stations } from '../pages/Stations'
import DevLib from '../pages/DevLib'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Stations />} />
      <Route path="/stations" element={<Stations />} />
      <Route path="/devlib" element={<DevLib />} />
    </Routes>
  )
}
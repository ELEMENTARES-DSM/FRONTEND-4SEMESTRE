import { Route, Routes } from 'react-router-dom'
import DevLib from '../pages/DevLib'

export function AppRoutes() {
  return (
    <Routes>
      {/* <Route path="/" element={<ComponentShowcase />} /> */}
      <Route path="/devlib" element={<DevLib />} />
    </Routes>
  )
}
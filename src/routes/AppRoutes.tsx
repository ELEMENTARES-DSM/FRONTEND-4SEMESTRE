import { Route, Routes } from "react-router-dom";
import DevLib from "../pages/DevLib";
import { Alerts } from "../pages/Alerts";

export function AppRoutes() {
  return (
    <Routes>
      {/* <Route path="/" element={<ComponentShowcase />} /> */}
      <Route path="/devlib" element={<DevLib />} />
      <Route path="/alerts" element={<Alerts />} />
    </Routes>
  );
}

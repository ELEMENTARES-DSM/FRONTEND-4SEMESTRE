import { Navigate, Route, Routes } from "react-router-dom";
import { Platform } from "../pages/Platform/Platform";
import { StationDetails } from "../pages/StationDetail/StationDetail";
import DevLib from "../pages/DevLib";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/platform" replace />} />
      <Route path="/platform" element={<Platform />} />
      {/* <Route path="/" element={<ComponentShowcase />} /> */}
      <Route path="/devlib" element={<DevLib />} />
      <Route
        path="/platform/estacoes/:estacaoId"
        element={<StationDetails />}
      />
    </Routes>
  );
}

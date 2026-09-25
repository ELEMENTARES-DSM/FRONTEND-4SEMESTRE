import { Navigate, Route, Routes } from "react-router-dom";
import { Platform } from "../pages/platform/Platform";
import { StationDetails } from "../pages/StationDetail/StationDetail";
import DevLib from "../pages/DevLib";
import { Alerts } from "../pages/Alerts";
import { Login } from "../pages/Login/Login";
import { ProtectedRoute } from "./ProtectedRoute";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/platform" replace />} />
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/platform" element={<Platform />} />
        <Route
          path="/platform/estacoes/:estacaoId"
          element={<StationDetails />}
        />
      </Route>
      <Route path="/devlib" element={<DevLib />} />
      <Route path="/alerts" element={<Alerts />} />
    </Routes>
  );
}

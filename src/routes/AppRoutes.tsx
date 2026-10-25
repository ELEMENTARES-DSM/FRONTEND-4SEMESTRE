import { Navigate, Route, Routes } from "react-router-dom";
import { Stations } from '../pages/Stations'
import { Platform } from "../pages/platform/Platform";
import { StationDetails } from "../pages/StationDetail/StationDetail";
import DevLib from "../pages/DevLib";
import { Alerts } from "../pages/Alerts";
import { Login } from "../pages/Login/Login";
import { ProtectedRoute } from "./ProtectedRoute";
import { AppLayout } from "../AppLayout";
import { Usuarios } from "../pages/Usuarios/Usuarios";
import { Alarmes } from "../pages/Alarmes/Alarmes";

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/platform" replace />} />
          <Route path="/platform" element={<Platform />} />
          <Route path="/platform/usuarios" element={
            <ProtectedRoute allowedRoles={['ADMINISTRADOR']}>
              <Usuarios />
            </ProtectedRoute>
          } />
          <Route
          path="/platform/territory"
          element={
            <ProtectedRoute requiredPermission="territory.access">
              <Stations />
            </ProtectedRoute>
          }
        />
        <Route
          path="/platform/estacoes/:estacaoId"
          element={
            <ProtectedRoute requiredPermission="stations.view">
              <StationDetails />
            </ProtectedRoute>
          }
        />
          <Route
            path="/alerts"
            element={
              <ProtectedRoute requiredPermission="alerts.manage">
                <Alerts />
              </ProtectedRoute>
            }
          />
          {["/platform/alarmes", "/platform/alarmes/:alarmeId"].map((path) => (
            <Route
              key={path}
              path={path}
              element={
                <ProtectedRoute requiredPermission="alarms.view">
                  <Alarmes />
                </ProtectedRoute>
              }
            />
          ))}
        </Route>
      </Route>

      <Route path="/login" element={<Login />} />
      <Route path="/devlib" element={<DevLib />} />
    </Routes>
  );
}

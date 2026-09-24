  // src/routes/AppRoutes.tsx
    import { Navigate, Route, Routes } from 'react-router-dom';
    import { AppLayout } from '../AppLayout';
    import { Platform } from '../pages/Platform/Platform';
    import DevLib from '../pages/DevLib';
    
    export function AppRoutes() {
      return (
        <Routes>
          {/* Rotas que utilizam layout padrão */}
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/platform" replace />} />
            <Route path="/platform" element={<Platform />} />
          </Route>
    
          {/* Rotas Autônomas (Sem layout padrão) */}
          <Route path="/devlib" element={<DevLib />} />
        </Routes>
      );
    }
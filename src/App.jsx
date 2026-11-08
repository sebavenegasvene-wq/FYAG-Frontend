import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { guardarPerfil, homeFor, logout } from "./api/auth";
import { getPerfil } from "./api/usuarios";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminHome from "./pages/admin/AdminHome";
import AdminObrasPage from "./pages/admin/AdminObrasPage";
import UsuariosPage from "./pages/admin/UsuariosPage";
import CambiarPasswordPage from "./pages/CambiarPasswordPage";
import ClientesPage from "./pages/finanzas/ClientesPage";
import CobranzasPage from "./pages/finanzas/CobranzasPage";
import FinanzasPage from "./pages/FinanzasPage";
import GerenciaPage from "./pages/GerenciaPage";
import LoginPage from "./pages/LoginPage";
import ObrasPage from "./pages/obras/ObrasPage";
import PresupuestosPage from "./pages/finanzas/PresupuestosPage";
import ReportesPage from "./pages/finanzas/ReportesPage";
import SupervisorPage from "./pages/SupervisorPage";
import TecnicoPage from "./pages/TecnicoPage";
import TiposServicioPage from "./pages/TiposServicioPage";

// /dashboard manda a cada usuario a su panel según su rol
function RoleRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        let role = localStorage.getItem("role");
        if (!role) {
          const profile = await getPerfil();
          guardarPerfil(profile);
          role = profile.role;
          if (profile.debeCambiarPassword) {
            if (active) navigate("/cambiar-password", { replace: true });
            return;
          }
        }
        if (active) navigate(homeFor(role), { replace: true });
      } catch {
        logout();
        if (active) navigate("/login", { replace: true });
      }
    })();
    return () => { active = false; };
  }, [navigate]);

  return null;
}

const ADMIN = ["ADMIN"];
const FIN_GER = ["FINANZAS", "GERENCIA"];
const OBRAS_CONSULTA = ["FINANZAS", "GERENCIA"];

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/cambiar-password" element={<CambiarPasswordPage />} />

        {/* Administrador */}
        <Route path="/admin" element={<ProtectedRoute roles={ADMIN}><AdminHome /></ProtectedRoute>} />
        <Route path="/admin/dashboard" element={<ProtectedRoute roles={ADMIN}><AdminDashboardPage /></ProtectedRoute>} />
        <Route path="/admin/obras" element={<ProtectedRoute roles={ADMIN}><AdminObrasPage /></ProtectedRoute>} />
        <Route path="/admin/usuarios" element={<ProtectedRoute roles={ADMIN}><UsuariosPage /></ProtectedRoute>} />

        {/* Gerencia y Finanzas */}
        <Route path="/gerencia" element={<ProtectedRoute roles={["GERENCIA"]}><GerenciaPage /></ProtectedRoute>} />
        <Route path="/finanzas" element={<ProtectedRoute roles={["FINANZAS"]}><FinanzasPage /></ProtectedRoute>} />
        <Route path="/presupuestos" element={<ProtectedRoute roles={FIN_GER}><PresupuestosPage /></ProtectedRoute>} />
        <Route path="/clientes" element={<ProtectedRoute roles={["FINANZAS"]}><ClientesPage /></ProtectedRoute>} />
        <Route path="/cobranzas" element={<ProtectedRoute roles={FIN_GER}><CobranzasPage /></ProtectedRoute>} />
        <Route path="/reportes" element={<ProtectedRoute roles={FIN_GER}><ReportesPage /></ProtectedRoute>} />
        <Route path="/obras" element={<ProtectedRoute roles={OBRAS_CONSULTA}><ObrasPage /></ProtectedRoute>} />

        {/* Supervisor y Técnico */}
        <Route path="/supervisor" element={<ProtectedRoute roles={["SUPERVISOR"]}><SupervisorPage /></ProtectedRoute>} />
        <Route path="/tipos-servicio" element={<ProtectedRoute roles={["SUPERVISOR"]}><TiposServicioPage /></ProtectedRoute>} />
        <Route path="/tecnico" element={<ProtectedRoute roles={["TECNICO"]}><TecnicoPage /></ProtectedRoute>} />

        <Route path="/dashboard" element={<ProtectedRoute><RoleRedirect /></ProtectedRoute>} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import CambiarPasswordPage from "./pages/CambiarPasswordPage";
import SupervisorPage from "./pages/SupervisorPage";
import TecnicoPage from "./pages/TecnicoPage";
import FinanzasPage from "./pages/FinanzasPage";
import GerenciaPage from "./pages/GerenciaPage";
import AdminHome from "./pages/admin/AdminHome";
import UsuariosPage from "./pages/admin/UsuariosPage";
import AdminObrasPage from "./pages/admin/AdminObrasPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { getPerfil } from "./api/usuarios";
import { guardarPerfil, homeFor, logout } from "./api/auth";

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

const ADMIN_ROLE = ["ADMIN"];

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/cambiar-password" element={<CambiarPasswordPage />} />
        <Route path="/admin" element={<ProtectedRoute roles={ADMIN_ROLE}><AdminHome /></ProtectedRoute>} />
        <Route path="/admin/usuarios" element={<ProtectedRoute roles={ADMIN_ROLE}><UsuariosPage /></ProtectedRoute>} />
        <Route path="/admin/obras" element={<ProtectedRoute roles={ADMIN_ROLE}><AdminObrasPage /></ProtectedRoute>} />
        <Route path="/supervisor" element={<ProtectedRoute><SupervisorPage /></ProtectedRoute>} />
        <Route path="/tecnico" element={<ProtectedRoute><TecnicoPage /></ProtectedRoute>} />
        <Route path="/finanzas" element={<ProtectedRoute><FinanzasPage /></ProtectedRoute>} />
        <Route path="/gerencia" element={<ProtectedRoute><GerenciaPage /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><RoleRedirect /></ProtectedRoute>} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

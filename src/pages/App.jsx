import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";
import CambiarPasswordPage from "./pages/CambiarPasswordPage";
import SupervisorPage from "./pages/SupervisorPage";
import TecnicoPage from "./pages/TecnicoPage";
import FinanzasPage from "./pages/FinanzasPage";
import GerenciaPage from "./pages/GerenciaPage";
import AdminHome from "./pages/admin/AdminHome";
import UsuariosPage from "./pages/admin/UsuariosPage";
import AdminObrasPage from "./pages/admin/AdminObrasPage";
import { getPerfil } from "./api/usuarios";
import { guardarPerfil, homeFor, logout } from "./api/auth";

// /dashboard ya no es solo del admin: manda a cada usuario a su panel según su rol
function RoleRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        let role = localStorage.getItem("role");
        if (!role) {
          const perfil = await getPerfil();
          guardarPerfil(perfil);
          role = perfil.role;
          if (perfil.debeCambiarPassword) return navigate("/cambiar-password", { replace: true });
        }
        if (activo) navigate(homeFor(role), { replace: true });
      } catch {
        logout();
        if (activo) navigate("/login", { replace: true });
      }
    })();
    return () => { activo = false; };
  }, [navigate]);

  return null;
}

const SOLO_ADMIN = ["ADMIN"];

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/cambiar-password" element={<CambiarPasswordPage />} />

        {/* Administración */}
        <Route path="/admin" element={<ProtectedRoute roles={SOLO_ADMIN}><AdminHome /></ProtectedRoute>} />
        <Route path="/admin/usuarios" element={<ProtectedRoute roles={SOLO_ADMIN}><UsuariosPage /></ProtectedRoute>} />
        <Route path="/admin/obras" element={<ProtectedRoute roles={SOLO_ADMIN}><AdminObrasPage /></ProtectedRoute>} />

        {/* Otros roles (los iremos restringiendo cuando los trabajemos) */}
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
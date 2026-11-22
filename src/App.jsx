// App.jsx: define TODAS las rutas (direcciones) de la aplicación y qué roles pueden entrar a cada una.
import { useEffect } from "react";
// react-router-dom: permite tener varias "páginas" sin recargar el navegador
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";
// Funciones de sesión: guardar el perfil, saber a qué pantalla ir según el rol y cerrar sesión
import { guardarPerfil, homeFor, logout } from "./api/auth";
import { getPerfil } from "./api/usuarios";
// ProtectedRoute: componente que bloquea una ruta si no hay sesión o el rol no corresponde
import ProtectedRoute from "./components/ProtectedRoute";
// Páginas del sistema (una por pantalla)
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminObrasPage from "./pages/admin/AdminObrasPage";
import UsuariosPage from "./pages/admin/UsuariosPage";
import CambiarPasswordPage from "./pages/CambiarPasswordPage";
import ClientesPage from "./pages/finanzas/ClientesPage";
import CobranzasPage from "./pages/finanzas/CobranzasPage";
import FinanzasPage from "./pages/FinanzasPage";
import GerenciaPage from "./pages/GerenciaPage";
import LoginPage from "./pages/LoginPage";
import InicioPage from "./pages/InicioPage";
import PerfilPage from "./pages/PerfilPage";
import ObrasPage from "./pages/obras/ObrasPage";
import PresupuestosPage from "./pages/finanzas/PresupuestosPage";
import ReportesPage from "./pages/finanzas/ReportesPage";
import SupervisorPage from "./pages/SupervisorPage";
import TecnicoPage from "./pages/TecnicoPage";
import TiposServicioPage from "./pages/TiposServicioPage";
import AuditoriaPage from "./pages/AuditoriaPage";
// /dashboard manda a cada usuario a su panel según su rol
// Si no hay rol guardado, lo pide al servidor; si debe cambiar contraseña lo manda a esa pantalla; si no, va al inicio de su perfil
function RoleRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    // 'active' evita actualizar la pantalla si el usuario ya se fue de aquí
    let active = true;
    (async () => {
      try {
        // El rol se guarda en localStorage al iniciar sesión
        let role = localStorage.getItem("role");
        if (!role) {
          // Pide al backend los datos del usuario logueado
          const profile = await getPerfil();
          guardarPerfil(profile);
          role = profile.role;
          // Si es su primer ingreso (contraseña temporal), lo obliga a cambiarla
          if (profile.debeCambiarPassword) {
            if (active) navigate("/cambiar-password", { replace: true });
            return;
          }
        }
        if (active) navigate(homeFor(role), { replace: true });
      // Si algo falla (token inválido o vencido), cierra la sesión y vuelve al login
      } catch {
        logout();
        if (active) navigate("/login", { replace: true });
      }
    })();
    return () => { active = false; };
  }, [navigate]);

  return null;
}

// Grupos de roles que se reutilizan en las rutas de abajo
const ADMIN = ["ADMIN"];
const FIN_GER = ["FINANZAS", "GERENCIA"];
const OBRAS_CONSULTA = ["FINANZAS", "GERENCIA"];
const ADMIN_GER = ["ADMIN", "GERENCIA"];

// Componente principal: contiene el enrutador con todas las rutas
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas (no requieren sesión) */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/cambiar-password" element={<CambiarPasswordPage />} />
        {/* Rutas para cualquier usuario con sesión iniciada (ProtectedRoute sin 'roles') */}
        <Route path="/inicio" element={<ProtectedRoute><InicioPage /></ProtectedRoute>} />
        <Route path="/perfil" element={<ProtectedRoute><PerfilPage /></ProtectedRoute>} />

        {/* Administrador */}
        <Route path="/admin" element={<Navigate to="/inicio" replace />} />
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

        <Route path="/auditoria" element={<ProtectedRoute roles={ADMIN_GER}><AuditoriaPage /></ProtectedRoute>} />

        {/* Redirige a cada usuario a su pantalla de inicio */}
        <Route path="/dashboard" element={<ProtectedRoute><RoleRedirect /></ProtectedRoute>} />
        {/* Cualquier dirección desconocida vuelve al dashboard (que a su vez redirige o manda al login) */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

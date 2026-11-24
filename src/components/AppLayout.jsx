import { useCallback } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { getRole, homeFor, logout } from "../api/auth";
import { useInactividad } from "../hooks/useInactividad";
import { NAV, ROLE_LABEL } from "../lib/roles";
import HelpButton from "./HelpButton";
import NotificationBell from "./NotificationBell";
import ThemeControls from "./ThemeControls";

// Estructura común a todos los perfiles: menú filtrado por rol, usuario, cierre de sesión y ayuda.
// APP LAYOUT: el 'marco' que comparten todas las pantallas (encabezado con menú, usuario, avatar de herramientas, botón de ayuda). Cada página lo usa y le pasa su contenido como 'children'.
export default function AppLayout({ title, subtitle, actions, children }) {
  const navigate = useNavigate();
  // Rol y nombre del usuario guardados al iniciar sesión
  const role = getRole();
  const username = localStorage.getItem("username");

  // Cerrar sesión: borra los datos guardados y vuelve al login
  const cerrarSesion = useCallback(() => {
    logout();
    navigate("/login", { replace: true });
  }, [navigate]);

  // Cierra la sesión sola tras 30 minutos sin actividad
  useInactividad(cerrarSesion, 30);

  // Opciones del menú según el rol (ver NAV en lib/roles.js) más 'Mi perfil' para todos
  const enlaces = [...(NAV[role] ?? []), { to: "/perfil", label: "Mi perfil" }];

  return (
    <main className="adm-page">
      <div className="adm-wrap">
        {/* Encabezado: logo, menú, usuario y herramientas */}
        <header className="adm-header">
          <Link to={homeFor(role)} className="adm-logo" aria-label="Ir al inicio">FYAG</Link>
          <nav className="adm-nav" aria-label="Navegación principal">
            {/* Una opción por cada enlace; NavLink marca como 'active' la de la página actual */}
            {enlaces.map((e) => (
              <NavLink key={e.to} to={e.to} end={e.end} className={({ isActive }) => (isActive ? "active" : "")}>{e.label}</NavLink>
            ))}
          </nav>
          <div className="adm-user">
            <div className="adm-user-info"><strong>{username}</strong><small>{ROLE_LABEL[role] ?? role}</small></div>
            {/* Campana de avisos, controles de tema/letra y botón de salir */}
            <NotificationBell rol={role} />
            <ThemeControls />
            <button className="adm-btn adm-btn-sm adm-logout" onClick={cerrarSesion}>Cerrar sesión</button>
          </div>
        </header>
        {/* Título de la página y botones de acción que envía cada pantalla */}
        <div className="adm-head">
          <div>
            {title && <h1 className="adm-title">{title}</h1>}
            {subtitle && <p className="adm-sub">{subtitle}</p>}
          </div>
          {actions}
        </div>
        {/* Aquí va el contenido propio de cada pantalla */}
        {children}
      </div>
      {/* Botón de ayuda flotante (?) que está en todas las pantallas */}
      <HelpButton />
    </main>
  );
}
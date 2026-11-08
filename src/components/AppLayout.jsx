import { useCallback } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { getRole, homeFor, logout } from "../api/auth";
import { useInactividad } from "../hooks/useInactividad";
import { NAV, ROLE_LABEL } from "../lib/roles";
import HelpButton from "./HelpButton";

// Estructura común a todos los perfiles: menú filtrado por rol, usuario, cierre de sesión y ayuda.
export default function AppLayout({ title, subtitle, actions, children }) {
  const navigate = useNavigate();
  const role = getRole();
  const username = localStorage.getItem("username");

  const cerrarSesion = useCallback(() => {
    logout();
    navigate("/login", { replace: true });
  }, [navigate]);

  useInactividad(cerrarSesion, 30);

  const enlaces = [...(NAV[role] ?? []), { to: "/cambiar-password", label: "Mi contraseña" }];

  return (
    <main className="adm-page">
      <div className="adm-wrap">
        <header className="adm-header">
          <Link to={homeFor(role)} className="adm-logo" aria-label="Ir al inicio">FYAG</Link>
          <nav className="adm-nav" aria-label="Navegación principal">
            {enlaces.map((e) => (
              <NavLink key={e.to} to={e.to} end={e.end} className={({ isActive }) => (isActive ? "active" : "")}>{e.label}</NavLink>
            ))}
          </nav>
          <div className="adm-user">
            <div className="adm-user-info"><strong>{username}</strong><small>{ROLE_LABEL[role] ?? role}</small></div>
            <button className="adm-btn adm-btn-sm adm-logout" onClick={cerrarSesion}>Cerrar sesión</button>
          </div>
        </header>
        <div className="adm-head">
          <div>
            {title && <h1 className="adm-title">{title}</h1>}
            {subtitle && <p className="adm-sub">{subtitle}</p>}
          </div>
          {actions}
        </div>
        {children}
      </div>
      <HelpButton />
    </main>
  );
}

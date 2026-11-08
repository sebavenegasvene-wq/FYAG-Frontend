import { Link, NavLink, useNavigate } from "react-router-dom";
import { logout } from "../../api/auth";
import "./admin.css";

export default function AdminLayout({ title, subtitle, children }) {
  const navigate = useNavigate();
  const username = localStorage.getItem("username");

  const cerrarSesion = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <main className="adm-page">
      <header className="adm-header">
        <Link to="/admin" className="adm-brand" aria-label="Inicio de administración">
          <span className="adm-badge">FYAG</span>
          <span>
            <strong>Frío y Agroindustria SpA</strong>
            <small>Administración del sistema{username ? ` — ${username}` : ""}</small>
          </span>
        </Link>
        <nav className="adm-nav" aria-label="Navegación de administración">
          <NavLink to="/admin" end className={({ isActive }) => (isActive ? "active" : "")}>Inicio</NavLink>
          <NavLink to="/admin/usuarios" className={({ isActive }) => (isActive ? "active" : "")}>Usuarios</NavLink>
          <NavLink to="/admin/obras" className={({ isActive }) => (isActive ? "active" : "")}>Obras</NavLink>
          <NavLink to="/cambiar-password" className={({ isActive }) => (isActive ? "active" : "")}>Mi contraseña</NavLink>
          <button className="adm-btn" onClick={cerrarSesion}>Cerrar sesión</button>
        </nav>
      </header>
      <h1 className="adm-title">{title}</h1>
      {subtitle && <p className="adm-sub">{subtitle}</p>}
      {children}
    </main>
  );
}
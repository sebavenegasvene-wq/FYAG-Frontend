import { Link } from "react-router-dom";
import AdminLayout from "./AdminLayout";

const MODULOS = [
  { to: "/admin/dashboard", icono: "📊", titulo: "Dashboard", texto: "Ventas del mes, presupuestos, obras en proceso y cuentas por cobrar, más el resumen operativo.", color: "info" },
  { to: "/admin/obras", icono: "🏗️", titulo: "Obras", texto: "Revisa el estado, el técnico y las fechas de cada obra (solo lectura, sin montos).", color: "warn" },
  { to: "/admin/usuarios", icono: "👥", titulo: "Usuarios", texto: "Crea cuentas, asigna perfiles, desactiva empleados, resetea claves y desbloquea accesos.", color: "ok" },
  { to: "/cambiar-password", icono: "🔑", titulo: "Mi contraseña", texto: "Actualiza la contraseña de tu propia cuenta.", color: "bad" },
];

export default function AdminHome() {
  return (
    <AdminLayout title="Panel de Administración" subtitle="Elige un módulo para comenzar.">
      <section className="adm-modules" aria-label="Módulos">
        {MODULOS.map((m) => (
          <Link key={m.to} to={m.to} className={`adm-module ${m.color}`}>
            <span className="adm-module-icon" aria-hidden="true">{m.icono}</span>
            <strong>{m.titulo}</strong>
            <small>{m.texto}</small>
            <span className="adm-module-go">Abrir →</span>
          </Link>
        ))}
      </section>
    </AdminLayout>
  );
}
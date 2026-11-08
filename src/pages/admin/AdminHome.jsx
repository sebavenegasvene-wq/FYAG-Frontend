import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getUsuarios } from "../../api/usuarios";
import { getObras } from "../../api/obras";
import AdminLayout from "./AdminLayout";

const total = (pagina) => pagina?.page?.totalElements ?? pagina?.content?.length ?? 0;

export default function AdminHome() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let activo = true;
    Promise.all([
      getUsuarios({ size: 1 }),
      getUsuarios({ activo: true, size: 1 }),
      getUsuarios({ activo: false, size: 1 }),
      getObras({ estado: "EN_PROCESO", size: 1 }),
    ])
      .then(([todos, activos, inactivos, obras]) => {
        if (activo) setStats({ todos: total(todos), activos: total(activos), inactivos: total(inactivos), obras: total(obras) });
      })
      .catch(() => activo && setError("No se pudieron cargar los indicadores."));
    return () => { activo = false; };
  }, []);

  const valor = (n) => (stats ? n : "—");

  return (
    <AdminLayout title="Panel de Administración" subtitle="Gestión de cuentas, perfiles y acceso. Sin acceso a información financiera.">
      {error && <div className="adm-alert" role="alert">{error}</div>}

      <section className="adm-stats" aria-label="Resumen">
        <article className="adm-card adm-stat"><span>USUARIOS REGISTRADOS</span><strong>{valor(stats?.todos)}</strong><small>Total de cuentas</small></article>
        <article className="adm-card adm-stat"><span>CUENTAS ACTIVAS</span><strong>{valor(stats?.activos)}</strong><small>Pueden iniciar sesión</small></article>
        <article className="adm-card adm-stat"><span>CUENTAS DESACTIVADAS</span><strong>{valor(stats?.inactivos)}</strong><small>Historial conservado</small></article>
        <article className="adm-card adm-stat"><span>OBRAS EN PROCESO</span><strong>{valor(stats?.obras)}</strong><small>Solo lectura</small></article>
      </section>

      <section className="adm-modules" aria-label="Módulos">
        <Link to="/admin/usuarios" className="adm-module">
          <strong>▤ Gestión de usuarios</strong>
          <small>Crear cuentas con clave temporal, asignar perfiles, desactivar empleados, resetear claves y desbloquear cuentas.</small>
        </Link>
        <Link to="/admin/obras" className="adm-module">
          <strong>▦ Obras (solo lectura)</strong>
          <small>Consulta el estado de las obras para dar soporte. No muestra montos ni permite editar.</small>
        </Link>
        <Link to="/cambiar-password" className="adm-module">
          <strong>⚿ Mi contraseña</strong>
          <small>Actualiza la contraseña de tu propia cuenta.</small>
        </Link>
      </section>
    </AdminLayout>
  );
}
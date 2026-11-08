import { useCallback, useEffect, useState } from "react";
import { getDashboard } from "../../api/dashboard";
import { getObras } from "../../api/obras";
import { getUsuarios } from "../../api/usuarios";
import AdminLayout from "./AdminLayout";
import { clp } from "./formato";

const total = (pagina) => pagina?.page?.totalElements ?? pagina?.content?.length ?? 0;

function Kpi({ titulo, valor, detalle, tono, bloqueado }) {
  return (
    <article className={`adm-card adm-kpi ${bloqueado ? "locked" : tono}`}>
      <span>{titulo}</span>
      <strong>{bloqueado ? "🔒 Sin acceso" : valor}</strong>
      <small>{bloqueado ? "El servidor aún no autoriza este dato al Administrador" : detalle}</small>
    </article>
  );
}

export default function AdminDashboardPage() {
  const [fin, setFin] = useState(null);          // datos de /dashboard (financieros)
  const [sinAcceso, setSinAcceso] = useState(false);
  const [op, setOp] = useState(null);            // datos operativos
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    setSinAcceso(false);

    // 1) Financieros: pueden dar 403 para el ADMIN
    try {
      setFin(await getDashboard());
    } catch (e) {
      setFin(null);
      if (e.response?.status === 403) setSinAcceso(true);
      else setError("No se pudieron cargar los indicadores del dashboard.");
    }

    // 2) Operativos: el ADMIN sí tiene acceso
    try {
      const [enProceso, finalizadas, suspendidas, canceladas, activos, tecnicos] = await Promise.all([
        getObras({ estado: "EN_PROCESO", size: 1 }),
        getObras({ estado: "FINALIZADA", size: 1 }),
        getObras({ estado: "SUSPENDIDA", size: 1 }),
        getObras({ estado: "CANCELADA", size: 1 }),
        getUsuarios({ activo: true, size: 1 }),
        getUsuarios({ role: "TECNICO", activo: true, size: 1 }),
      ]);
      setOp({
        enProceso: total(enProceso), finalizadas: total(finalizadas),
        suspendidas: total(suspendidas), canceladas: total(canceladas),
        activos: total(activos), tecnicos: total(tecnicos),
      });
    } catch {
      setError("No se pudo cargar el resumen operativo.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const v = (valor) => (cargando ? "—" : valor);
  const obrasEnProceso = fin?.obrasEnProceso ?? op?.enProceso;

  return (
    <AdminLayout title="Dashboard" subtitle="Indicadores del negocio, actualizados al cargar la vista.">
      {error && <div className="adm-alert" role="alert">{error}</div>}
      {sinAcceso && !cargando && (
        <div className="adm-notice" role="status">
          Las cifras de ventas, presupuestos y cuentas por cobrar requieren que el servidor autorice al
          perfil Administrador en <code>/dashboard</code>. Cuando lo autorice, aparecerán aquí automáticamente.
        </div>
      )}

      <section className="adm-kpis" aria-label="Indicadores principales">
        <Kpi titulo="VENTAS DEL MES" tono="ok" bloqueado={sinAcceso} valor={v(clp(fin?.ventasDelMes))} detalle="Facturas pagadas en el mes" />
        <Kpi titulo="PRESUPUESTOS APROBADOS" tono="ok" bloqueado={sinAcceso} valor={v(fin?.presupuestosAprobados)} detalle="Habilitan la creación de obras" />
        <Kpi titulo="PRESUPUESTOS PENDIENTES" tono="bad" bloqueado={sinAcceso} valor={v(fin?.presupuestosPendientes)} detalle="Esperando aprobación" />
        <Kpi titulo="OBRAS EN PROCESO" tono="info" valor={v(obrasEnProceso)} detalle="En ejecución actualmente" />
        <Kpi titulo="CUENTAS POR COBRAR" tono="bad" bloqueado={sinAcceso} valor={v(clp(fin?.cuentasPorCobrar))} detalle="Facturas pendientes de pago" />
      </section>

      <h2 className="adm-section">Resumen operativo</h2>
      <section className="adm-kpis" aria-label="Resumen operativo">
        <Kpi titulo="OBRAS FINALIZADAS" tono="ok" valor={v(op?.finalizadas)} detalle="Trabajo terminado" />
        <Kpi titulo="OBRAS SUSPENDIDAS" tono="warn" valor={v(op?.suspendidas)} detalle="Pausadas con motivo registrado" />
        <Kpi titulo="OBRAS CANCELADAS" tono="bad" valor={v(op?.canceladas)} detalle="Cerradas sin ejecutarse" />
        <Kpi titulo="USUARIOS ACTIVOS" tono="ok" valor={v(op?.activos)} detalle="Pueden iniciar sesión" />
        <Kpi titulo="TÉCNICOS ACTIVOS" tono="info" valor={v(op?.tecnicos)} detalle="Disponibles para asignar" />
      </section>

      <button className="adm-btn" onClick={cargar} disabled={cargando}>
        {cargando ? "Actualizando..." : "↻ Actualizar"}
      </button>
    </AdminLayout>
  );
}
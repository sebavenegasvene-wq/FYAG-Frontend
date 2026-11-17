import { useCallback, useEffect, useState } from "react";
import { getObras } from "../../api/obras";
import { getUsuarios } from "../../api/usuarios";
import AdminLayout from "./AdminLayout";
import { clp } from "./formato";

const total = (pagina) => pagina?.page?.totalElements ?? pagina?.content?.length ?? 0;

function Kpi({ titulo, valor, detalle, tono }) {
  return (
    <article className={`adm-card adm-kpi ${tono}`}>
      <span>{titulo}</span>
      <strong>{valor}</strong>
      <small>{detalle}</small>
    </article>
  );
}

export default function AdminDashboardPage() {
  // El Admin no tiene acceso a cifras financieras: no se llama a /dashboard.
  const fin = null;
  const sinAcceso = true;
  const [op, setOp] = useState(null);            // datos operativos
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);

    // Operativos
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

      <section className="adm-kpis" aria-label="Indicadores principales">
        {!sinAcceso && <Kpi titulo="VENTAS DEL MES" tono="ok" valor={v(clp(fin?.ventasDelMes))} detalle="Facturas pagadas en el mes" />}
        {!sinAcceso && <Kpi titulo="PRESUPUESTOS APROBADOS" tono="ok" valor={v(fin?.presupuestosAprobados)} detalle="Habilitan la creación de obras" />}
        {!sinAcceso && <Kpi titulo="PRESUPUESTOS PENDIENTES" tono="bad" valor={v(fin?.presupuestosPendientes)} detalle="Esperando aprobación" />}
        <Kpi titulo="OBRAS EN PROCESO" tono="info" valor={v(obrasEnProceso)} detalle="En ejecución actualmente" />
        {!sinAcceso && <Kpi titulo="CUENTAS POR COBRAR" tono="bad" valor={v(clp(fin?.cuentasPorCobrar))} detalle="Facturas pendientes de pago" />}
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
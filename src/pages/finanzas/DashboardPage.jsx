import { useCallback, useEffect, useState } from "react";
import { getDashboard } from "../../api/dashboard";
import { getClientesPendientes } from "../../api/facturas";
import { getObras } from "../../api/obras";
import { getRole } from "../../api/auth";
import AppLayout from "../../components/AppLayout";
import { Alert, Barras, Kpi } from "../../components/ui";
import { lista, pick } from "../../lib/datos";
import { mensajeError } from "../../lib/errores";
import { clp } from "../../lib/format";
import { ESTADO_OBRA } from "../../lib/roles";

// UI-02: cuatro KPIs que se actualizan solos al cargar + resumen por estado y por servicio (EP-05, HU-16..18).
export default function DashboardPage() {
  const rol = getRole();
  const [fin, setFin] = useState(null);
  const [obras, setObras] = useState([]);
  const [deudores, setDeudores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true); setError(null);
    const [d, o, p] = await Promise.allSettled([getDashboard(), getObras({ size: 200 }), getClientesPendientes()]);
    if (d.status === "fulfilled") setFin(d.value); else { setFin(null); setError(mensajeError(d.reason, "No se pudieron cargar los indicadores.")); }
    setObras(o.status === "fulfilled" ? lista(o.value) : []);
    setDeudores(p.status === "fulfilled" ? lista(p.value) : []);
    setCargando(false);
  }, []);
  useEffect(() => { cargar(); }, [cargar]);

  const v = (x) => (cargando ? "—" : x ?? "—");
  const porEstado = Object.entries(ESTADO_OBRA).map(([k, e]) => ({ label: e.label, tono: e.tono, valor: obras.filter((o) => o.estado === k).length }));
  const conteoServicio = new Map();
  obras.forEach((o) => conteoServicio.set(o.tipoServicioNombre ?? "Sin clasificar", (conteoServicio.get(o.tipoServicioNombre ?? "Sin clasificar") ?? 0) + 1));
  const porServicio = [...conteoServicio].map(([label, valor]) => ({ label, valor })).sort((a, b) => b.valor - a.valor).slice(0, 8);
  const topDeudores = [...deudores]
    .map((c) => ({ label: pick(c, "clienteRazonSocial", "razonSocial", "clienteNombre") ?? "—", monto: Number(pick(c, "montoAdeudado", "montoPendiente", "deuda", "monto") ?? 0) }))
    .sort((a, b) => b.monto - a.monto).slice(0, 5);

  return (
    <AppLayout title={rol === "GERENCIA" ? "Dashboard gerencial" : "Dashboard financiero"} subtitle="Indicadores del negocio, actualizados al cargar la vista. Verde: pagado o finalizado. Rojo: pendiente."
      actions={<button className="adm-btn" onClick={cargar} disabled={cargando}>{cargando ? "Actualizando..." : "↻ Actualizar"}</button>}>
      <Alert>{error}</Alert>
      <section className="adm-kpis" aria-label="Indicadores principales">
        <Kpi titulo="VENTAS DEL MES" tono="ok" valor={v(fin && clp(fin.ventasDelMes))} detalle="Facturas pagadas en el mes" />
        <Kpi titulo="PRESUPUESTOS APROBADOS" tono="ok" valor={v(fin?.presupuestosAprobados)} detalle="Habilitan la creación de obras" />
        <Kpi titulo="PRESUPUESTOS PENDIENTES" tono="bad" valor={v(fin?.presupuestosPendientes)} detalle="Esperando aprobación" />
        <Kpi titulo="OBRAS EN PROCESO" tono="info" valor={v(fin?.obrasEnProceso)} detalle="En ejecución actualmente" />
        <Kpi titulo="CUENTAS POR COBRAR" tono="bad" valor={v(fin && clp(fin.cuentasPorCobrar))} detalle="Facturas pendientes de pago" />
      </section>
      <div className="adm-grid-2">
        <section className="adm-card"><h2 className="adm-card-title">Obras por estado</h2><p className="adm-card-sub">Cartera registrada hasta hoy</p><Barras items={porEstado} /></section>
        <section className="adm-card"><h2 className="adm-card-title">Obras por tipo de servicio</h2><p className="adm-card-sub">Los servicios con más obras</p><Barras items={porServicio} /></section>
      </div>
      <section className="adm-card">
        <h2 className="adm-card-title">Mayores deudas pendientes</h2><p className="adm-card-sub">Clientes con más monto por cobrar</p>
        {topDeudores.length === 0 ? <p className="adm-sub">No hay clientes con pagos pendientes.</p> : (
          <div className="adm-bars">
            {topDeudores.map((d) => (
              <div className="adm-bar" key={d.label} style={{ gridTemplateColumns: "minmax(90px,170px) 1fr auto" }}>
                <span>{d.label}</span><div><i className="bad" style={{ width: `${(d.monto / topDeudores[0].monto) * 100}%` }} /></div><strong>{clp(d.monto)}</strong>
              </div>
            ))}
          </div>
        )}
      </section>
    </AppLayout>
  );
}

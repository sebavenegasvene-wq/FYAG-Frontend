import { useCallback, useEffect, useMemo, useState } from "react";
import { getObras } from "../../api/obras";
import AdminLayout from "./AdminLayout";

const ESTADOS = [
  { value: "", label: "Todos los estados" },
  { value: "EN_PROCESO", label: "En proceso" },
  { value: "FINALIZADA", label: "Finalizada" },
  { value: "SUSPENDIDA", label: "Suspendida" },
  { value: "CANCELADA", label: "Cancelada" },
];
const ESTADO_LABEL = Object.fromEntries(ESTADOS.filter((e) => e.value).map((e) => [e.value, e.label]));
// Colores estandarizados del sistema: verde = finalizada, rojo = cancelada/alerta
const ESTADO_CLASE = { EN_PROCESO: "info", FINALIZADA: "ok", SUSPENDIDA: "warn", CANCELADA: "bad" };
const fecha = (f) => (f ? new Date(`${f}T00:00:00`).toLocaleDateString("es-CL") : "—");

function DetalleModal({ obra, onClose }) {
  return (
    <div className="adm-overlay" onMouseDown={(ev) => ev.target === ev.currentTarget && onClose()}>
      <section className="adm-modal" role="dialog" aria-modal="true" aria-labelledby="obra-titulo">
        <h2 id="obra-titulo">{obra.nombre}</h2>
        <p>{obra.clienteRazonSocial} · <span className={`adm-pill ${ESTADO_CLASE[obra.estado]}`}>{ESTADO_LABEL[obra.estado] ?? obra.estado}</span></p>
        <div className="adm-detail">
          <div><h3>TIPO DE SERVICIO</h3><p>{obra.tipoServicioNombre}</p></div>
          <div><h3>TÉCNICO ASIGNADO</h3><p>{obra.tecnicoNombre ?? "Sin asignar"}</p></div>
          <div><h3>FECHA DE INICIO</h3><p>{fecha(obra.fechaInicio)}</p></div>
          <div><h3>FECHA DE TÉRMINO</h3><p>{fecha(obra.fechaTermino)}</p></div>
          <div className="wide"><h3>DESCRIPCIÓN</h3><p>{obra.descripcion || "Sin descripción."}</p></div>
          {obra.motivoSuspension && <div className="wide"><h3>MOTIVO DE SUSPENSIÓN</h3><p>{obra.motivoSuspension}</p></div>}
        </div>
        <div className="adm-modal-actions"><button className="adm-btn adm-btn-primary" onClick={onClose}>Cerrar</button></div>
      </section>
    </div>
  );
}

export default function AdminObrasPage() {
  const [pagina, setPagina] = useState(0);
  const [data, setData] = useState({ content: [], page: { totalPages: 0, totalElements: 0 } });
  const [estado, setEstado] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [detalle, setDetalle] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const params = { page: pagina, size: 10 };
      if (estado) params.estado = estado;
      setData(await getObras(params));
    } catch (e) {
      setError(e.response?.data?.detail || "No se pudieron cargar las obras.");
    } finally {
      setCargando(false);
    }
  }, [pagina, estado]);

  useEffect(() => { cargar(); }, [cargar]);

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLocaleLowerCase("es");
    if (!q) return data.content;
    return data.content.filter((o) =>
      `${o.nombre} ${o.clienteRazonSocial} ${o.tipoServicioNombre} ${o.tecnicoNombre ?? ""}`.toLocaleLowerCase("es").includes(q));
  }, [data, busqueda]);

  const totalPaginas = data.page?.totalPages ?? 0;

  return (
    <AdminLayout title="Obras" subtitle="Vista de solo lectura para dar soporte. El Administrador no ve montos ni modifica obras.">
      <section className="adm-card">
        <div className="adm-toolbar">
          <div className="adm-filters">
            <input className="adm-input" aria-label="Buscar obra" placeholder="Buscar obra, cliente o técnico..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
            <select className="adm-select" aria-label="Filtrar por estado" value={estado} onChange={(e) => { setPagina(0); setEstado(e.target.value); }}>
              {ESTADOS.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
            </select>
          </div>
        </div>

        {error && <div className="adm-alert" role="alert">{error}</div>}

        <div className="adm-table-scroll">
          <table className="adm-table">
            <thead><tr><th>OBRA</th><th>CLIENTE</th><th>SERVICIO</th><th>TÉCNICO</th><th>INICIO</th><th>ESTADO</th><th>DETALLE</th></tr></thead>
            <tbody>
              {cargando && <tr><td className="adm-empty" colSpan="7">Cargando obras...</td></tr>}
              {!cargando && visibles.length === 0 && <tr><td className="adm-empty" colSpan="7">No hay obras con esos filtros.</td></tr>}
              {!cargando && visibles.map((o) => (
                <tr key={o.id}>
                  <td><strong>{o.nombre}</strong></td>
                  <td>{o.clienteRazonSocial}</td>
                  <td>{o.tipoServicioNombre}</td>
                  <td>{o.tecnicoNombre ?? <small>Sin asignar</small>}</td>
                  <td>{fecha(o.fechaInicio)}</td>
                  <td><span className={`adm-pill ${ESTADO_CLASE[o.estado]}`}>{ESTADO_LABEL[o.estado] ?? o.estado}</span></td>
                  <td><button className="adm-btn adm-btn-sm" onClick={() => setDetalle(o)}>Ver ficha</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="adm-pager">
          <span>{data.page?.totalElements ?? 0} obra(s) · Página {totalPaginas ? pagina + 1 : 0} de {totalPaginas}</span>
          <div>
            <button className="adm-btn adm-btn-sm" disabled={pagina === 0} onClick={() => setPagina((p) => p - 1)}>← Anterior</button>
            <button className="adm-btn adm-btn-sm" disabled={pagina + 1 >= totalPaginas} onClick={() => setPagina((p) => p + 1)}>Siguiente →</button>
          </div>
        </div>
      </section>
      {detalle && <DetalleModal obra={detalle} onClose={() => setDetalle(null)} />}
    </AdminLayout>
  );
}
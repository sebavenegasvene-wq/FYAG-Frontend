import { useCallback, useEffect, useState } from "react";
import { getAuditoria, getAuditoriaPorFecha, getAuditoriaPorUsuario } from "../api/auditoria";
import { getUsuarios } from "../api/usuarios";
import AppLayout from "../components/AppLayout";
import { Alert, DataTable, Pager, Pill } from "../components/ui";
import { lista, paginaVacia } from "../lib/datos";
import { mensajeError } from "../lib/errores";
import { clp, humanizar, rangoMes } from "../lib/format";

const CAMPOS_CLP = ["materiales", "valor_hora", "monto", "monto_total"];

const esNumero = (v) => (typeof v === "number" || (typeof v === "string" && v.trim() !== "")) && !Number.isNaN(Number(v));
const iguales = (a, b) => (esNumero(a) && esNumero(b) ? Number(a) === Number(b) : String(a ?? "") === String(b ?? ""));

const formatear = (clave, v) => {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? "Sí" : "No";
  if (typeof v === "object") return JSON.stringify(v);
  if (CAMPOS_CLP.includes(clave) && esNumero(v)) return clp(v);
  if (esNumero(v)) return Number(v).toLocaleString("es-CL");
  return String(v);
};

// Solo los campos que realmente cambiaron
const cambiosDe = (log) => {
  const antes = log.valorAnterior ?? {};
  const despues = log.valorNuevo ?? {};
  return [...new Set([...Object.keys(antes), ...Object.keys(despues)])]
    .filter((k) => !iguales(antes[k], despues[k]))
    .map((k) => ({ clave: k, antes: antes[k], despues: despues[k] }));
};

const tonoAccion = (accion = "") =>
  /ANULAR|RECHAZAR|CANCELAR|DESACTIVAR/.test(accion) ? "bad"
  : /APROBAR|FINALIZAR|PAGO|ACTIVAR/.test(accion) ? "ok"
  : /SUSPEN/.test(accion) ? "warn"
  : "info";

function Cambios({ log }) {
  const cambios = cambiosDe(log);
  if (!cambios.length) return <small className="aud-muted">{log.valorAnterior || log.valorNuevo ? "Sin cambios en los valores" : "—"}</small>;
  return (
    <ul className="aud-cambios">
      {cambios.map((c) => (
        <li key={c.clave}>
          <span>{humanizar(c.clave)}</span>
          {c.antes === undefined || c.antes === null
            ? <b>{formatear(c.clave, c.despues)}</b>
            : <><s>{formatear(c.clave, c.antes)}</s> → <b>{formatear(c.clave, c.despues)}</b></>}
        </li>
      ))}
    </ul>
  );
}

export default function AuditoriaPage() {
  const inicial = rangoMes(0);
  const [vista, setVista] = useState("todos"); // todos | usuario | fecha
  const [usuarioId, setUsuarioId] = useState("");
  const [desde, setDesde] = useState(inicial.desde);
  const [hasta, setHasta] = useState(inicial.hasta);
  const [usuarios, setUsuarios] = useState([]);
  const [pagina, setPagina] = useState(0);
  const [data, setData] = useState(paginaVacia);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getUsuarios({ size: 100 }).then((r) => setUsuarios(lista(r))).catch(() => setUsuarios([]));
  }, []);

  const cargar = useCallback(async () => {
    setError(null);
    if (vista === "usuario" && !usuarioId) { setData(paginaVacia); setCargando(false); return; }
    if (vista === "fecha" && (!desde || !hasta || desde > hasta)) {
      setData(paginaVacia); setCargando(false);
      setError("Elige un rango de fechas válido (desde no puede ser posterior a hasta).");
      return;
    }
    setCargando(true);
    try {
      const params = { page: pagina, size: 20 };
      const r = vista === "usuario" ? await getAuditoriaPorUsuario(usuarioId, params)
        : vista === "fecha" ? await getAuditoriaPorFecha({ ...params, desde, hasta })
        : await getAuditoria(params);
      setData(r);
    } catch (e) { setError(mensajeError(e, "No se pudo cargar la auditoría.")); }
    finally { setCargando(false); }
  }, [vista, usuarioId, desde, hasta, pagina]);
  useEffect(() => { cargar(); }, [cargar]);

  const cambiar = (setter) => (e) => { setPagina(0); setter(e.target.value); };
  const nombreUsuario = (id) => usuarios.find((u) => u.id === id)?.username ?? `#${id}`;

  const columnas = [
    { label: "Fecha", render: (l) => {
      const d = new Date(l.fecha);
      return <div className="aud-fecha"><strong>{d.toLocaleDateString("es-CL")}</strong><small>{d.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}</small></div>;
    } },
    { label: "Usuario", render: (l) => <div className="aud-fecha"><strong>{nombreUsuario(l.usuarioId)}</strong><small>{l.usuarioRol}</small></div> },
    { label: "Acción", render: (l) => <Pill tono={tonoAccion(l.accion)}>{humanizar(l.accion)}</Pill> },
    { label: "Entidad", render: (l) => <>{humanizar(l.entidad)} <small className="aud-muted">#{l.entidadId}</small></> },
    { label: "Cambios", render: (l) => <Cambios log={l} /> },
    { label: "Motivo", render: (l) => l.motivo ?? "—" },
  ];

  return (
    <AppLayout title="Auditoría" subtitle="Historial de cambios del sistema (solo lectura). Los más recientes primero.">
      <section className="adm-card">
        <div className="adm-toolbar">
          <div className="adm-filters">
            <select className="adm-select" aria-label="Tipo de consulta" value={vista} onChange={cambiar(setVista)}>
              <option value="todos">Todos los registros</option>
              <option value="usuario">Por usuario</option>
              <option value="fecha">Por fecha</option>
            </select>
            {vista === "usuario" && (
              <select className="adm-select" aria-label="Usuario" value={usuarioId} onChange={cambiar(setUsuarioId)}>
                <option value="">Selecciona un usuario...</option>
                {usuarios.map((u) => <option key={u.id} value={u.id}>{u.username} ({u.nombre} {u.apellido})</option>)}
              </select>
            )}
            {vista === "fecha" && (<>
              <input type="date" className="adm-input" aria-label="Desde" value={desde} onChange={cambiar(setDesde)} />
              <input type="date" className="adm-input" aria-label="Hasta" value={hasta} onChange={cambiar(setHasta)} />
            </>)}
          </div>
          <button className="adm-btn" onClick={cargar}>Actualizar</button>
        </div>
        <Alert>{error}</Alert>
        <DataTable columnas={columnas} filas={lista(data)} cargando={cargando}
          vacio={vista === "usuario" && !usuarioId ? "Selecciona un usuario para ver su historial." : "No hay registros de auditoría."} />
        <Pager data={data} pagina={pagina} setPagina={setPagina} unidad="registro(s)" />
      </section>
    </AppLayout>
  );
}
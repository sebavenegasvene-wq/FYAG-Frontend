import { useCallback, useEffect, useState } from "react";
import { getAuditoria, getAuditoriaPorFecha, getAuditoriaPorUsuario } from "../api/auditoria";
import { getUsuarios } from "../api/usuarios";
import AppLayout from "../components/AppLayout";
import { Alert, DataTable, Pager, Pill } from "../components/ui";
import { lista, paginaVacia } from "../lib/datos";
import { mensajeError } from "../lib/errores";
import { clp, humanizar, rangoMes } from "../lib/format";

// AUDITORÍA: historial de todo lo que se hizo en el sistema (quién, qué, cuándo, valor anterior y nuevo). Es solo lectura: nadie puede borrar ni editar estos registros.
const CAMPOS_CLP = ["materiales", "valor_hora", "monto", "monto_total"];

// Funciones para mostrar los valores: ¿es un número?, ¿dos valores son iguales?
const esNumero = (v) => (typeof v === "number" || (typeof v === "string" && v.trim() !== "")) && !Number.isNaN(Number(v));
const iguales = (a, b) => (esNumero(a) && esNumero(b) ? Number(a) === Number(b) : String(a ?? "") === String(b ?? ""));

// Da formato legible a un valor (plata en pesos, números con puntos, Sí/No...)
const formatear = (clave, v) => {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? "Sí" : "No";
  if (typeof v === "object") return JSON.stringify(v);
  if (CAMPOS_CLP.includes(clave) && esNumero(v)) return clp(v);
  if (esNumero(v)) return Number(v).toLocaleString("es-CL");
  return String(v);
};

// Solo los campos que realmente cambiaron
// Compara valor anterior y nuevo y devuelve solo los campos que realmente cambiaron
const cambiosDe = (log) => {
  const antes = log.valorAnterior ?? {};
  const despues = log.valorNuevo ?? {};
  return [...new Set([...Object.keys(antes), ...Object.keys(despues)])]
    .filter((k) => !iguales(antes[k], despues[k]))
    .map((k) => ({ clave: k, antes: antes[k], despues: despues[k] }));
};

// Color de la etiqueta según la acción: rojo = anular/rechazar, verde = aprobar/pagar, ámbar = suspender
const tonoAccion = (accion = "") =>
  /ANULAR|RECHAZAR|CANCELAR|DESACTIVAR/.test(accion) ? "bad"
  : /APROBAR|FINALIZAR|PAGO|ACTIVAR/.test(accion) ? "ok"
  : /SUSPEN/.test(accion) ? "warn"
  : "info";

// Muestra la lista de cambios de un registro (antes tachado → después en negrita)
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

// Pantalla de auditoría
export default function AuditoriaPage() {
  // El filtro por fecha parte con el mes actual
  const inicial = rangoMes(0);
  // Tipo de consulta (todos, por usuario o por fecha) y valores de los filtros
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
    // Carga la lista de usuarios para el filtro 'Por usuario' y para mostrar nombres
    getUsuarios({ size: 100 }).then((r) => setUsuarios(lista(r))).catch(() => setUsuarios([]));
  }, []);

  // Pide los registros al backend según el filtro elegido, de 20 en 20 (paginado)
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

  // Al cambiar un filtro vuelve a la página 1
  const cambiar = (setter) => (e) => { setPagina(0); setter(e.target.value); };
  // Convierte el id de usuario en su nombre de usuario
  const nombreUsuario = (id) => usuarios.find((u) => u.id === id)?.username ?? `#${id}`;

  // Columnas de la tabla
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
      {/* Filtros: tipo de consulta y, según el tipo, usuario o fechas */}
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
        {/* Tabla con los registros y botones de página */}
        <DataTable columnas={columnas} filas={lista(data)} cargando={cargando}
          vacio={vista === "usuario" && !usuarioId ? "Selecciona un usuario para ver su historial." : "No hay registros de auditoría."} />
        <Pager data={data} pagina={pagina} setPagina={setPagina} unidad="registro(s)" />
      </section>
    </AppLayout>
  );
}
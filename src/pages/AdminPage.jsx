import { useEffect, useMemo, useState } from "react";
import { logout } from "../api/auth";
import { getObras } from "../api/obras";
import "./AdminPage.css";

const DEMO_OBRAS = [
  { codigo: "OBR-2026-01", cliente: "Agrícola San Carlos SpA", comuna: "San Carlos", servicio: "Climatización", presupuesto: 3300000, estado: "En proceso", descripcion: "Climatización Agroindustrial", equipos: ["Central Frigorífica 30 HP", "Evaporador Bitzer", "Tablero Control PLC"], observacion: "Montaje de tuberías de refrigerante completado al 80%. Pruebas de presión programadas." },
  { codigo: "OBR-2026-02", cliente: "Frutícola Chillán", comuna: "Chillán", servicio: "Mantención", presupuesto: 720000, estado: "Finalizada", descripcion: "Mantención de equipos industriales", equipos: ["Unidad condensadora", "Evaporador industrial", "Controlador digital"], observacion: "Mantención preventiva finalizada y equipos operativos." },
  { codigo: "OBR-2026-03", cliente: "Packing Coihueco", comuna: "Coihueco", servicio: "Emergencia", presupuesto: 2250000, estado: "Suspendida", descripcion: "Atención de emergencia", equipos: ["Compresor industrial", "Sistema de refrigeración"], observacion: "Obra suspendida. Revisar observaciones con el cliente." },
  { codigo: "OBR-2026-04", cliente: "Congelados Bulnes", comuna: "Bulnes", servicio: "Proyecto Eléctrico", presupuesto: 3500000, estado: "En proceso", descripcion: "Proyecto eléctrico industrial", equipos: ["Tablero eléctrico", "Protección de motores", "Cableado de potencia"], observacion: "Instalación eléctrica en ejecución." },
];

const SERVICE_TYPES = ["Climatización", "Mantención", "Emergencia", "Proyecto Eléctrico"];
const COMMUNES = ["Chillán", "San Carlos", "Coihueco", "Bulnes"];
const money = (value) => new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 }).format(Number(value) || 0);
const read = (item, ...keys) => keys.map((key) => item?.[key]).find((value) => value !== undefined && value !== null && value !== "");

function normalizeObra(item, index) {
  const rawBudget = read(item, "presupuesto", "monto", "montoTotal", "total", "budget", "valor") ?? 0;
  const status = String(read(item, "estado", "status") ?? "En proceso").replaceAll("_", " ");
  return {
    ...item,
    id: read(item, "id", "obraId") ?? index,
    codigo: read(item, "codigo", "codigoObra", "numero", "code") ?? `OBR-${String(index + 1).padStart(4, "0")}`,
    cliente: read(item, "cliente", "nombreCliente", "client", "razonSocial") ?? "Cliente sin nombre",
    comuna: read(item, "comuna", "ubicacion", "ciudad", "location") ?? "Sin comuna",
    servicio: read(item, "tipoServicio", "servicio", "tipo", "service") ?? "Servicio general",
    presupuesto: Number(String(rawBudget).replace(/[^\d.-]/g, "")) || 0,
    estado: status.charAt(0).toUpperCase() + status.slice(1).toLowerCase(),
    descripcion: read(item, "descripcion", "descripcionRequerimiento", "observacion", "detalle") ?? `${read(item, "tipoServicio", "servicio", "tipo", "service") ?? "Servicio"} industrial`,
    fecha: read(item, "fecha", "fechaCreacion", "createdAt") ?? new Date().toLocaleDateString("es-CL"),
  };
}

function FieldSheet({ obra, onClose }) {
  const equipmentValue = read(obra, "equipos", "equiposAsociados", "equipamiento", "equipment");
  const equipment = Array.isArray(equipmentValue)
    ? equipmentValue
    : typeof equipmentValue === "string" && equipmentValue.trim()
      ? equipmentValue.split(",").map((item) => item.trim()).filter(Boolean)
      : [];
  const observation = read(obra, "observacion", "observaciones", "observacionInicial", "bitacora", "notes");

  return (
    <div className="admin-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="admin-sheet-dialog" role="dialog" aria-modal="true" aria-label={`Ficha de ${obra.codigo}`}>
        <header className="admin-sheet-header">
          <div><span>{obra.codigo}</span><h2>{obra.cliente}</h2><p>Comuna: {obra.comuna} — Servicio: {obra.servicio}</p></div>
          <button className="admin-sheet-close-icon" aria-label="Cerrar ficha" onClick={onClose}>×</button>
        </header>
        <section className="admin-sheet-section"><h3>⚙ EQUIPOS DE REFRIGERACIÓN ASOCIADOS</h3><ul>{equipment.length ? equipment.map((item, index) => <li key={`${item}-${index}`}>{item}</li>) : <li>No hay equipos asociados a esta obra.</li>}</ul></section>
        <section className="admin-sheet-section"><h3>▣ BITÁCORA DE OBSERVACIONES (TERRENO)</h3><blockquote>{observation || "Sin observaciones registradas."}</blockquote></section>
        <footer className="admin-sheet-actions"><button className="admin-button" onClick={onClose}>Cerrar Ficha</button></footer>
      </section>
    </div>
  );
}

function DocumentPreview({ obra, onClose }) {
  const subtotal = obra.presupuesto;
  const iva = Math.round(subtotal * 0.19);

  return (
    <div className="admin-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="admin-document-dialog" role="dialog" aria-modal="true" aria-labelledby="document-title">
        <article className="admin-document" id="admin-document">
          <header className="document-header">
            <div><span className="document-badge">FYAG</span><h2>FRÍO Y AGROINDUSTRIA SpA</h2><p>R.U.T.: 76.890.123-K — Chillán, Región del Ñuble</p><p>Servicios de Refrigeración Industrial y Climatización</p></div>
            <div className="document-number"><span>DOCUMENTO DE PRESUPUESTO</span><strong>{obra.codigo}</strong><span>Fecha: {obra.fecha}</span></div>
          </header>
          <div className="document-rule" />
          <div className="document-parties">
            <div><span>CLIENTE:</span><strong>{obra.cliente}</strong><small>Comuna: {obra.comuna}, Chile</small></div>
            <div><span>TIPO DE SERVICIO:</span><strong>{obra.servicio}</strong><small>Estado: {obra.estado}</small></div>
          </div>
          <div className="document-lines-heading"><span>DESCRIPCIÓN DEL REQUERIMIENTO</span><span>MONTO NETO</span></div>
          <div className="document-line"><div><strong>{obra.descripcion}</strong><small>Incluye mano de obra especializada e insumos técnicos.</small></div><strong>$ {money(subtotal)}</strong></div>
          <div className="document-totals"><p>Subtotal: $ {money(subtotal)}</p><p>IVA (19%): $ {money(iva)}</p><strong>Total CLP: $ {money(subtotal + iva)}</strong></div>
        </article>
        <footer className="document-actions"><button className="admin-button admin-button-quiet" onClick={onClose}>Cerrar</button><button className="admin-button admin-button-primary" onClick={() => window.print()}>▣ Imprimir / Guardar PDF</button></footer>
      </section>
    </div>
  );
}

export default function AdminPage() {
  const [obras, setObras] = useState(DEMO_OBRAS.map(normalizeObra));
  const [usingDemo, setUsingDemo] = useState(false);
  const [search, setSearch] = useState("");
  const [commune, setCommune] = useState("Todas las Comunas (Ñuble)");
  const [filter, setFilter] = useState("Todos");
  const [selectedObra, setSelectedObra] = useState(null);
  const [selectedFicha, setSelectedFicha] = useState(null);

  useEffect(() => {
    let active = true;
    getObras()
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.content ?? data?.obras ?? data?.items ?? [];
        if (active && list.length) {
          setObras(list.map(normalizeObra));
          setUsingDemo(false);
        }
      })
      .catch(() => { if (active) setUsingDemo(true); });
    return () => { active = false; };
  }, []);

  const visibleObras = useMemo(() => obras.filter((obra) => {
    const matchesSearch = `${obra.codigo} ${obra.cliente}`.toLocaleLowerCase("es").includes(search.toLocaleLowerCase("es"));
    const matchesCommune = commune === "Todas las Comunas (Ñuble)" || obra.comuna.toLocaleLowerCase("es") === commune.toLocaleLowerCase("es");
    const matchesStatus = filter === "Todos" || obra.estado.toLowerCase() === filter.toLowerCase();
    return matchesSearch && matchesCommune && matchesStatus;
  }), [obras, search, commune, filter]);

  const total = obras.reduce((sum, obra) => sum + obra.presupuesto, 0);
  const inProgress = obras.filter((obra) => /proceso|terreno|activa/i.test(obra.estado)).length;
  const completed = obras.filter((obra) => /finalizada|finalizado|completada/i.test(obra.estado)).length;
  const suspended = obras.filter((obra) => /suspendida|suspendido/i.test(obra.estado)).length;
  const byService = SERVICE_TYPES.map((servicio) => ({
    servicio,
    total: obras.filter((obra) => obra.servicio.toLowerCase() === servicio.toLowerCase()).reduce((sum, obra) => sum + obra.presupuesto, 0),
  }));
  const chartMax = Math.max(...byService.map((item) => item.total), 1);

  const closeSession = () => {
    logout();
    window.location.assign("/login");
  };

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div className="admin-brand"><span className="admin-brand-badge">FYAG</span><div><h1>Frío y Agroindustria SpA</h1><p>Gestión de Obras y Presupuestos — Rol: Administrador del Sistema</p></div></div>
        <div className="admin-header-actions"><button className="admin-button admin-button-primary" onClick={() => window.alert("El registro de obras se habilitará al conectar el formulario de creación.")}>＋ Nueva Obra</button><button className="admin-button" onClick={closeSession}>Cerrar Sesión</button></div>
      </header>

      <section className="admin-stats" aria-label="Resumen de obras">
        <article className="admin-card admin-stat"><span>OBRAS EN TERRENO</span><strong>{inProgress}</strong><small>Activas en plantas</small></article>
        <article className="admin-card admin-stat"><span>OBRAS FINALIZADAS</span><strong>{completed}</strong><small>Listas para facturar</small></article>
        <article className="admin-card admin-stat"><span>SUSPENDIDAS / ALERTA</span><strong>{suspended}</strong><small>Revisar observaciones</small></article>
        <article className="admin-card admin-stat"><span>MONTO TOTAL CARTERA</span><strong>$ {money(total)}</strong><small>Proyectos registrados</small></article>
      </section>

      <section className="admin-card admin-chart-card">
        <h2>Presupuesto Acumulado por Tipo de Servicio</h2><p>Distribución de capital comprometido según categoría</p>
        <div className="admin-chart" role="img" aria-label="Presupuesto acumulado por tipo de servicio">
          <div className="chart-y-labels"><span>$ {money(chartMax)}</span><span>$ {money(chartMax * 0.66)}</span><span>$ {money(chartMax * 0.33)}</span><span>$ 0</span></div>
          <div className="chart-bars">{byService.map((item) => <div className="chart-column" key={item.servicio} tabIndex="0"><div className="chart-hover-card"><strong>{item.servicio}</strong><span>Presupuesto: $ {money(item.total)}</span></div><div className="chart-bar-track"><div className="chart-bar" style={{ height: `${Math.max((item.total / chartMax) * 100, item.total ? 4 : 0)}%` }} /></div><span>{item.servicio}</span></div>)}</div>
        </div>
      </section>

      <section className="admin-card admin-table-card">
        <div className="admin-table-toolbar"><div className="admin-search-filters"><input aria-label="Buscar cliente o código" placeholder="Buscar cliente o código..." value={search} onChange={(event) => setSearch(event.target.value)} /><select aria-label="Filtrar por comuna" value={commune} onChange={(event) => setCommune(event.target.value)}><option>Todas las Comunas (Ñuble)</option>{COMMUNES.map((item) => <option key={item}>{item}</option>)}</select></div><div className="admin-status-filters">{["Todos", "En proceso", "Finalizada", "Suspendida"].map((item) => <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item}</button>)}</div></div>
        <div className="admin-table-scroll"><table><thead><tr><th>CÓDIGO</th><th>CLIENTE</th><th>UBICACIÓN</th><th>SERVICIO</th><th>PRESUPUESTO</th><th>ESTADO</th><th>ACCIONES</th></tr></thead><tbody>{visibleObras.map((obra) => <tr key={obra.id}><td>{obra.codigo}</td><td>{obra.cliente}</td><td><span className="admin-location">⌖ {obra.comuna}</span></td><td>{obra.servicio}</td><td>$ {money(obra.presupuesto)}</td><td><span className="admin-status">{obra.estado}</span></td><td><div className="admin-row-actions"><button onClick={() => setSelectedFicha(obra)}>↗ Ficha</button><button onClick={() => setSelectedObra(obra)}>▣ PDF</button></div></td></tr>)}{visibleObras.length === 0 && <tr><td className="admin-empty" colSpan="7">No se encontraron obras con esos filtros.</td></tr>}</tbody></table></div>
      </section>
      {selectedFicha && <FieldSheet obra={selectedFicha} onClose={() => setSelectedFicha(null)} />}
      {selectedObra && <DocumentPreview obra={selectedObra} onClose={() => setSelectedObra(null)} />}
    </main>
  );
}

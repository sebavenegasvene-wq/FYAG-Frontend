import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { logout } from "../api/auth";
import { getObras } from "../api/obras";
import "./PanelRoles.css";

const OBRAS_EJEMPLO = [
  { id: "1", codigo: "OBR-2026-01", cliente: "Agrícola San Carlos SpA", comuna: "San Carlos", servicio: "Climatización", estado: "En proceso", presupuesto: 3300000, descripcion: "Montaje de sistema de climatización agroindustrial", equipos: ["Central Frigorífica 30 HP", "Evaporador Bitzer", "Tablero Control PLC"], observacion: "Montaje de tuberías completado al 80%." },
  { id: "2", codigo: "OBR-2026-02", cliente: "Frutícola Chillán", comuna: "Chillán", servicio: "Mantención", estado: "Finalizada", presupuesto: 720000, descripcion: "Mantención preventiva de equipos industriales", equipos: ["Unidad condensadora", "Evaporador industrial"], observacion: "Mantención preventiva finalizada." },
  { id: "3", codigo: "OBR-2026-03", cliente: "Packing Coihueco", comuna: "Coihueco", servicio: "Emergencia", estado: "Suspendida", presupuesto: 2250000, descripcion: "Atención de emergencia", equipos: ["Compresor industrial"], observacion: "Pendiente revisión de observaciones." },
  { id: "4", codigo: "OBR-2026-04", cliente: "Congelados Bulnes", comuna: "Bulnes", servicio: "Proyecto Eléctrico", estado: "En proceso", presupuesto: 3500000, descripcion: "Proyecto eléctrico industrial", equipos: ["Tablero eléctrico", "Protección de motores"], observacion: "Instalación en ejecución." },
];
const NAVEGACION = [
  { path: "/dashboard", label: "Administrador" },
  { path: "/supervisor", label: "Supervisor de Terreno" },
  { path: "/tecnico", label: "Técnico de Mantenimiento" },
  { path: "/finanzas", label: "Finanzas / Administración" },
  { path: "/gerencia", label: "Gerencia General" },
];
const money = (amount) => new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 }).format(Number(amount) || 0);
const firstValue = (item, ...keys) => keys.map((key) => item?.[key]).find((entry) => entry !== undefined && entry !== null && entry !== "");

function normalizeWork(item, index) {
  const rawBudget = firstValue(item, "presupuesto", "monto", "montoTotal", "total", "budget") ?? 0;
  const equipment = firstValue(item, "equipos", "equiposAsociados", "equipamiento", "equipment") ?? [];
  return {
    ...item,
    id: firstValue(item, "id", "obraId") ?? index,
    codigo: firstValue(item, "codigo", "codigoObra", "numero", "code") ?? `OBR-${String(index + 1).padStart(4, "0")}`,
    cliente: firstValue(item, "cliente", "nombreCliente", "razonSocial") ?? "Cliente sin nombre",
    comuna: firstValue(item, "comuna", "ubicacion", "ciudad") ?? "Sin comuna",
    servicio: firstValue(item, "tipoServicio", "servicio", "tipo") ?? "Servicio general",
    estado: String(firstValue(item, "estado", "status") ?? "En proceso").replaceAll("_", " "),
    presupuesto: Number(String(rawBudget).replace(/[^\d.-]/g, "")) || 0,
    descripcion: firstValue(item, "descripcion", "descripcionRequerimiento", "observacion", "detalle") ?? "Sin descripción registrada.",
    equipos: Array.isArray(equipment) ? equipment : String(equipment).split(",").map((entry) => entry.trim()).filter(Boolean),
    observacion: firstValue(item, "observacion", "observaciones", "bitacora", "notes") ?? "Sin observaciones registradas.",
  };
}

const contentByRole = {
  supervisor: {
    role: "Supervisor de Terreno",
    subtitle: "Seguimiento de obras, estados y observaciones en terreno.",
    visible: (works) => works,
    stats: (works) => [["OBRAS EN TERRENO", works.filter((work) => /proceso|terreno|activa/i.test(work.estado)).length, "Activas en plantas"], ["OBRAS FINALIZADAS", works.filter((work) => /finalizad|completad/i.test(work.estado)).length, "Listas para revisión"], ["SUSPENDIDAS / ALERTA", works.filter((work) => /suspendid/i.test(work.estado)).length, "Revisar observaciones"], ["CARTERA", "Restringido", "Información financiera"]],
  },
  technician: {
    role: "Técnico de Mantenimiento",
    subtitle: "Consulta de equipos, servicios y notas para trabajos técnicos.",
    visible: (works) => works.filter((work) => /mantenci|emergencia|climatiz/i.test(work.servicio)),
    stats: (works) => { const relevant = works.filter((work) => /mantenci|emergencia|climatiz/i.test(work.servicio)); return [["TRABAJOS TÉCNICOS", relevant.length, "Servicios disponibles"], ["EN PROCESO", relevant.filter((work) => /proceso|terreno|activa/i.test(work.estado)).length, "Requieren seguimiento"], ["EQUIPOS REGISTRADOS", relevant.reduce((sum, work) => sum + work.equipos.length, 0), "En obras visibles"], ["PRESUPUESTOS", "Restringido", "Información financiera"]]; },
  },
  finance: {
    role: "Finanzas / Administración",
    subtitle: "Control de presupuestos, cartera y estados de las obras.",
    visible: (works) => works,
    stats: (works) => [["MONTO TOTAL CARTERA", `$ ${money(works.reduce((sum, work) => sum + work.presupuesto, 0))}`, "Suma presupuestada"], ["OBRAS REGISTRADAS", works.length, "Proyectos en sistema"], ["FINALIZADAS", works.filter((work) => /finalizad|completad/i.test(work.estado)).length, "Pendientes de facturación"], ["SUSPENDIDAS", works.filter((work) => /suspendid/i.test(work.estado)).length, "Requieren revisión"]],
  },
  management: {
    role: "Gerencia General",
    subtitle: "Vista ejecutiva del portafolio y distribución de servicios.",
    visible: (works) => works,
    stats: (works) => [["OBRAS EN CARTERA", works.length, "Proyectos registrados"], ["EN EJECUCIÓN", works.filter((work) => /proceso|terreno|activa/i.test(work.estado)).length, "Activas actualmente"], ["FINALIZADAS", works.filter((work) => /finalizad|completad/i.test(work.estado)).length, "Obras terminadas"], ["MONTO CARTERA", `$ ${money(works.reduce((sum, work) => sum + work.presupuesto, 0))}`, "Suma presupuestada"]],
  },
};

function WorkDetail({ work, role, onClose }) {
  return <div className="role-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="role-modal" role="dialog" aria-modal="true" aria-label={`Ficha ${work.codigo}`}><header><div><span>{work.codigo}</span><h2>{work.cliente}</h2><p>{work.comuna} · {work.servicio} · {work.estado}</p></div><button aria-label="Cerrar" onClick={onClose}>×</button></header><div className="role-detail-grid"><div><h3>DESCRIPCIÓN</h3><p>{work.descripcion}</p></div><div><h3>EQUIPOS ASOCIADOS</h3>{work.equipos.length ? <ul>{work.equipos.map((equipment, index) => <li key={`${equipment}-${index}`}>{equipment}</li>)}</ul> : <p>Sin equipos registrados.</p>}</div><div className="role-detail-wide"><h3>OBSERVACIONES DE TERRENO</h3><p>{work.observacion}</p></div><div><h3>PRESUPUESTO</h3><p>$ {money(work.presupuesto)}</p></div><div><h3>ROL ACTUAL</h3><p>{role}</p></div></div><footer><button className="role-small-button" onClick={onClose}>Cerrar ficha</button></footer></section></div>;
}

function WorksTable({ works, selectWork, showBudget }) {
  if (!works.length) return <p className="role-empty">No hay obras que mostrar.</p>;
  return <div className="role-table-scroll"><table className="role-table"><thead><tr><th>CÓDIGO</th><th>CLIENTE</th><th>UBICACIÓN</th><th>SERVICIO</th>{showBudget && <th>PRESUPUESTO</th>}<th>ESTADO</th><th>DETALLE</th></tr></thead><tbody>{works.map((work) => <tr key={work.id}><td>{work.codigo}</td><td>{work.cliente}</td><td>{work.comuna}</td><td>{work.servicio}</td>{showBudget && <td>$ {money(work.presupuesto)}</td>}<td><span className="role-status">{work.estado}</span></td><td><button className="role-small-button" onClick={() => selectWork(work)}>Ver ficha</button></td></tr>)}</tbody></table></div>;
}

function ServiceSummary({ works }) {
  const totals = useMemo(() => { const counts = new Map(); works.forEach((work) => counts.set(work.servicio, (counts.get(work.servicio) ?? 0) + 1)); return [...counts]; }, [works]);
  const max = Math.max(1, ...totals.map(([, count]) => count));
  return <section className="role-panel"><header><div><h2>Obras por servicio</h2><p>Distribución de proyectos registrados</p></div></header><div className="role-chart">{totals.map(([service, count]) => <div className="role-chart-row" key={service}><span>{service}</span><div><i style={{ width: `${count / max * 100}%` }} /></div><strong>{count}</strong></div>)}</div></section>;
}

export default function PanelRoles({ kind }) {
  const config = contentByRole[kind];
  const [works, setWorks] = useState(OBRAS_EJEMPLO.map(normalizeWork));
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("Todos");
  const [usingDemo, setUsingDemo] = useState(false);

  useEffect(() => {
    let active = true;
    getObras().then((data) => { const list = Array.isArray(data) ? data : data?.content ?? data?.obras ?? data?.items ?? []; if (active && list.length) setWorks(list.map(normalizeWork)); }).catch(() => { if (active) setUsingDemo(true); });
    return () => { active = false; };
  }, []);

  const roleWorks = config.visible(works);
  const visibleWorks = roleWorks.filter((work) => `${work.codigo} ${work.cliente} ${work.servicio}`.toLocaleLowerCase("es").includes(search.toLocaleLowerCase("es")) && (status === "Todos" || work.estado.toLowerCase() === status.toLowerCase()));
  const stats = config.stats(works);
  const closeSession = () => { logout(); window.location.assign("/login"); };

  return <main className="role-page"><header className="role-header"><div className="role-brand"><span className="role-brand-badge">FYAG</span><div><h1>Frío y Agroindustria SpA</h1><p>Gestión de Obras y Presupuestos — Rol: <strong>{config.role}</strong></p></div></div><div className="role-header-actions"><label className="role-navigation-label" htmlFor="role-navigation">VISTA</label><select id="role-navigation" value={window.location.pathname} onChange={(event) => { window.location.href = event.target.value; }}>{NAVEGACION.map((item) => <option value={item.path} key={item.path}>{item.label}</option>)}</select><button className="role-logout" onClick={closeSession}>Cerrar Sesión</button></div></header>
    <section className="role-intro"><div><span className="role-eyebrow">PANEL DE TRABAJO</span><h2>{config.role}</h2><p>{config.subtitle}</p></div><Link to="/dashboard" className="role-admin-link">Panel de administrador ↗</Link></section>
    {usingDemo && <p className="role-demo-notice">No se pudo cargar el servidor; se muestran datos de ejemplo.</p>}
    <section className="role-stats">{stats.map(([label, number, detail]) => <article className={`role-card role-summary${number === "Restringido" ? " role-summary-muted" : ""}`} key={label}><span>{label}</span><strong>{number}</strong><small>{detail}</small></article>)}</section>
    {kind === "management" && <ServiceSummary works={works} />}
    {kind === "technician" && <section className="role-panel"><header><div><h2>Equipos de mantenimiento</h2><p>Equipos asociados a los trabajos técnicos disponibles</p></div></header><div className="role-equipment-grid">{roleWorks.flatMap((work) => work.equipos.map((equipment, index) => <article className="role-equipment-card" key={`${work.id}-${index}`}><span>{work.codigo} · {work.comuna}</span><h3>{equipment}</h3><p>{work.cliente}</p><button className="role-small-button" onClick={() => setSelected(work)}>Ver trabajo</button></article>))}</div></section>}
    {kind === "finance" && <section className="role-panel role-finance-summary"><header><div><h2>Resumen financiero</h2><p>Montos según los presupuestos disponibles en las obras.</p></div><button className="role-small-button" onClick={() => window.print()}>Imprimir resumen</button></header><div><span>Presupuesto total</span><strong>$ {money(works.reduce((sum, work) => sum + work.presupuesto, 0))}</strong></div><p>Los costos reales y las cobranzas requieren datos publicados por el backend.</p></section>}
    <section className="role-panel"><header><div><h2>{kind === "technician" ? "Trabajos técnicos" : kind === "supervisor" ? "Obras asignadas" : "Obras registradas"}</h2><p>{visibleWorks.length} resultado(s)</p></div><div className="role-filters"><input aria-label="Buscar obras" placeholder="Buscar código, cliente o servicio..." value={search} onChange={(event) => setSearch(event.target.value)} /><select aria-label="Filtrar obras por estado" value={status} onChange={(event) => setStatus(event.target.value)}>{["Todos", "En proceso", "Finalizada", "Suspendida"].map((item) => <option key={item}>{item}</option>)}</select></div></header><WorksTable works={visibleWorks} selectWork={setSelected} showBudget={kind === "finance" || kind === "management"} /></section>
    <footer className="role-footer"><span>FYAG · Gestión de Obras</span><span>{NAVEGACION.map((item, index) => <span key={item.path}>{index > 0 && " · "}<Link to={item.path}>{item.label}</Link></span>)}</span></footer>
    {selected && <WorkDetail work={selected} onClose={() => setSelected(null)} role={config.role} />}</main>;
}

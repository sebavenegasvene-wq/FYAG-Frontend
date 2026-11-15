import { useCallback, useEffect, useMemo, useState } from "react";
import { getObras } from "../../api/obras";
import { getRole } from "../../api/auth";
import AppLayout from "../../components/AppLayout";
import { Alert, DataTable, EstadoPill, Kpi, Pager, Toast } from "../../components/ui";
import { useToast } from "../../hooks/useToast";
import { paginaVacia, totalDe } from "../../lib/datos";
import { mensajeError } from "../../lib/errores";
import { fecha } from "../../lib/format";
import { ESTADO_OBRA } from "../../lib/roles";
import FichaObra from "./FichaObra";
import NuevaObraModal from "./NuevaObraModal";

const FILTROS = [{ value: "", label: "Todos los estados" }, ...Object.entries(ESTADO_OBRA).map(([value, e]) => ({ value, label: e.label }))];

// /supervisor (gestión completa) y /obras (consulta para Gerencia y Finanzas)
export default function ObrasPage() {
  const rol = getRole();
  const esSupervisor = rol === "SUPERVISOR";
  const [pagina, setPagina] = useState(0);
  const [data, setData] = useState(paginaVacia);
  const [estado, setEstado] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [conteos, setConteos] = useState(null);
  const [ficha, setFicha] = useState(null);
  const [nueva, setNueva] = useState(false);
  const { aviso, mostrar } = useToast();

  const cargar = useCallback(async () => {
    setCargando(true); setError(null);
    try {
      const params = { page: pagina, size: 10 };
      if (estado) params.estado = estado;
      setData(await getObras(params));
      const [a, b, c, d] = await Promise.all(Object.keys(ESTADO_OBRA).map((e) => getObras({ estado: e, size: 1 })));
      setConteos({ EN_PROCESO: totalDe(a), FINALIZADA: totalDe(b), SUSPENDIDA: totalDe(c), CANCELADA: totalDe(d) });
    } catch (e) { setError(mensajeError(e, "No se pudieron cargar las obras.")); }
    finally { setCargando(false); }
  }, [pagina, estado]);

  useEffect(() => { cargar(); }, [cargar]);

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLocaleLowerCase("es");
    if (!q) return data.content;
    return data.content.filter((o) => `${o.nombre} ${o.clienteRazonSocial} ${o.tipoServicioNombre} ${o.tecnicoNombre ?? ""}`.toLocaleLowerCase("es").includes(q));
  }, [data, busqueda]);

  const columnas = [
    { label: "Obra", render: (o) => <strong>{o.nombre}</strong> },
    { label: "Cliente", render: (o) => o.clienteRazonSocial },
    { label: "Servicio", render: (o) => o.tipoServicioNombre },
    { label: "Técnico", render: (o) => o.tecnicoNombre ?? <small>Sin asignar</small> },
    { label: "Inicio", render: (o) => fecha(o.fechaInicio) },
    { label: "Estado", render: (o) => <EstadoPill mapa={ESTADO_OBRA} valor={o.estado} /> },
    { label: "Acciones", acciones: true, render: (o) => <button className="adm-btn adm-btn-sm" onClick={() => setFicha(o)}>Ver ficha</button> },
  ];

  return (
    <AppLayout
      title={esSupervisor ? "Gestión de obras" : "Obras"}
      subtitle={esSupervisor ? "Crea obras desde presupuestos aprobados y controla su ciclo de vida." : "Vista de consulta. Abre la ficha para ver la rentabilidad real de cada obra."}
      actions={esSupervisor && <button className="adm-btn adm-btn-primary" onClick={() => setNueva(true)}>＋ Nueva obra</button>}
    >
      <section className="adm-kpis" aria-label="Resumen de obras">
        <Kpi titulo="EN PROCESO" tono="info" valor={conteos?.EN_PROCESO ?? "—"} detalle="En ejecución actualmente" />
        <Kpi titulo="FINALIZADAS" tono="ok" valor={conteos?.FINALIZADA ?? "—"} detalle="Listas para facturar" />
        <Kpi titulo="SUSPENDIDAS" tono="warn" valor={conteos?.SUSPENDIDA ?? "—"} detalle="Pausadas con motivo" />
        <Kpi titulo="CANCELADAS" tono="bad" valor={conteos?.CANCELADA ?? "—"} detalle="Cerradas sin ejecutarse" />
      </section>

      <section className="adm-card">
        <div className="adm-toolbar">
          <div className="adm-filters">
            <input className="adm-input" aria-label="Buscar obra" placeholder="Buscar obra, cliente o técnico..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
            <select className="adm-select" aria-label="Filtrar por estado" value={estado} onChange={(e) => { setPagina(0); setEstado(e.target.value); }}>
              {FILTROS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>
        </div>
        <Alert>{error}</Alert>
        <DataTable columnas={columnas} filas={visibles} cargando={cargando} vacio="No hay obras con esos filtros." />
        <Pager data={data} pagina={pagina} setPagina={setPagina} unidad="obra(s)" />
      </section>

      {ficha && <FichaObra obra={ficha} rol={rol} onClose={() => setFicha(null)} onCambio={(msg) => { setFicha(null); mostrar(msg); cargar(); }} />}
      {nueva && <NuevaObraModal onClose={() => setNueva(false)} onCreada={(o) => { setNueva(false); mostrar(`Obra «${o?.nombre ?? ""}» creada.`); cargar(); }} />}
      <Toast>{aviso}</Toast>
    </AppLayout>
  );
}

import { useEffect, useMemo, useState } from "react";
import { getClientes } from "../../api/clientes";
import { descargarReporteCobranzas, descargarReporteObras } from "../../api/reportes";
import { getTecnicos } from "../../api/usuarios";
import { getRole } from "../../api/auth";
import { getFacturas } from "../../api/facturas";
import { getObras } from "../../api/obras";
import AppLayout from "../../components/AppLayout";
import { Alert, DataTable, EstadoPill, Field, Toast } from "../../components/ui";
import { useToast } from "../../hooks/useToast";
import { descargarBlob, lista } from "../../lib/datos";
import { mensajeError } from "../../lib/errores";
import { clp, fecha, hoy, rangoMes } from "../../lib/format";
import { ESTADO_OBRA, ESTADO_PAGO } from "../../lib/roles";

// FormatoReporte del backend: ajusta estos valores si tu enum usa otros nombres.
const FORMATOS = [{ value: "PDF", label: "PDF", ext: "pdf" }, { value: "EXCEL", label: "Excel", ext: "xlsx" }];

// HU-19 (Finanzas: obras y cobranzas) y HU-20 (Gerencia: reporte por técnico). El archivo solo incluye lo filtrado.
export default function ReportesPage() {
  const esGerencia = getRole() === "GERENCIA";
  const [tipo, setTipo] = useState("obras");
  const [f, setF] = useState({ formato: "PDF", desde: "", hasta: "", estado: "", tecnicoId: "", clienteId: "" });
  const [tecnicos, setTecnicos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [descargando, setDescargando] = useState(null);
  const [error, setError] = useState(null);
  const [vista, setVista] = useState({ filas: [], cargando: true, error: null });
  const { aviso, mostrar } = useToast();

  useEffect(() => {
    getTecnicos().then((r) => setTecnicos(lista(r))).catch(() => {});
    getClientes({ size: 100 }).then((r) => setClientes(lista(r))).catch(() => {});
  }, []);

  // Vista previa: lista lo que se va a exportar con los mismos filtros, para elegir fechas viendo los datos.
  // Los filtros se mandan al backend y además se aplican acá, así la lista siempre coincide con lo elegido.
  useEffect(() => {
    let activo = true;
    setVista((v) => ({ ...v, cargando: true, error: null }));
    const params = { page: 0, size: 100 };
    if (tipo === "obras") { if (f.estado) params.estado = f.estado; if (f.tecnicoId) params.tecnicoId = f.tecnicoId; }
    else if (f.estado) params.estadoPago = f.estado;
    if (f.clienteId) params.clienteId = f.clienteId;
    if (f.desde) params.desde = f.desde;
    if (f.hasta) params.hasta = f.hasta;
    (tipo === "obras" ? getObras(params) : getFacturas(params))
      .then((r) => activo && setVista({ filas: lista(r), cargando: false, error: null }))
      .catch((e) => activo && setVista({ filas: [], cargando: false, error: mensajeError(e, "No se pudo cargar la vista previa.") }));
    return () => { activo = false; };
  }, [tipo, f.estado, f.tecnicoId, f.clienteId, f.desde, f.hasta]);

  const filasVista = useMemo(() => {
    const cli = clientes.find((c) => String(c.id) === String(f.clienteId));
    const tec = tecnicos.find((t) => String(t.id) === String(f.tecnicoId));
    const nomTec = tec ? (tec.nombre ? `${tec.nombre} ${tec.apellido ?? ""}`.trim() : tec.username) : null;
    return vista.filas.filter((x) => {
      const dia = String((tipo === "obras" ? x.fechaInicio : x.fechaEmision) ?? "").slice(0, 10);
      if (f.desde && dia && dia < f.desde) return false;
      if (f.hasta && dia && dia > f.hasta) return false;
      if (f.clienteId && (x.clienteId != null ? String(x.clienteId) !== String(f.clienteId) : cli && x.clienteRazonSocial !== cli.razonSocial)) return false;
      if (tipo === "obras" && f.tecnicoId && (x.tecnicoId != null ? String(x.tecnicoId) !== String(f.tecnicoId) : nomTec && !String(x.tecnicoNombre ?? "").includes(nomTec))) return false;
      return true;
    });
  }, [vista.filas, tipo, f, clientes, tecnicos]);
  const totalMonto = tipo === "cobranzas" ? filasVista.reduce((s, x) => s + Number(x.monto ?? 0), 0) : null;

  const columnasVista = tipo === "obras"
    ? [
      { label: "Obra", render: (o) => <strong>{o.nombre}</strong> },
      { label: "Cliente", render: (o) => o.clienteRazonSocial ?? "—" },
      { label: "Técnico", render: (o) => o.tecnicoNombre ?? <small>Sin asignar</small> },
      { label: "Inicio", render: (o) => fecha(o.fechaInicio) },
      { label: "Estado", render: (o) => <EstadoPill mapa={ESTADO_OBRA} valor={o.estado} /> },
    ]
    : [
      { label: "N° factura", render: (x) => <strong>{x.numeroFactura}</strong> },
      { label: "Cliente", render: (x) => x.clienteRazonSocial ?? "—" },
      { label: "Emisión", render: (x) => fecha(x.fechaEmision) },
      { label: "Vence", render: (x) => fecha(x.fechaVencimiento) },
      { label: "Monto", num: true, render: (x) => clp(x.monto) },
      { label: "Estado", render: (x) => <EstadoPill mapa={ESTADO_PAGO} valor={x.estadoPago} /> },
    ];

  const cambiar = (e) => { setF((x) => ({ ...x, [e.target.name]: e.target.value })); setError(null); };

  // Genera y descarga un reporte; "clave" identifica qué botón está trabajando.
  const generar = async (clave, tipoRep, params, nombre) => {
    setDescargando(clave); setError(null);
    try {
      const blob = await (tipoRep === "obras" ? descargarReporteObras(params) : descargarReporteCobranzas(params));
      descargarBlob(blob, nombre);
      mostrar("Reporte descargado.");
    } catch (err) {
      // Con responseType blob el error llega como Blob: lo leemos para mostrar el detalle
      let detalle = null;
      try { detalle = JSON.parse(await err.response?.data?.text?.()); } catch { /* sin detalle */ }
      setError(detalle?.detail ?? mensajeError(err, "No se pudo generar el reporte."));
    } finally { setDescargando(null); }
  };

  const descargar = (ev) => {
    ev.preventDefault();
    if (f.desde && f.hasta && f.hasta < f.desde) return setError("La fecha «hasta» no puede ser anterior a «desde».");
    const params = { formato: f.formato };
    ["desde", "hasta", "estado", "clienteId"].forEach((k) => f[k] && (params[k] = f[k]));
    if (tipo === "obras" && f.tecnicoId) params.tecnicoId = f.tecnicoId;
    const ext = FORMATOS.find((x) => x.value === f.formato).ext;
    return generar("form", tipo, params, `reporte-${tipo}-${hoy()}.${ext}`);
  };

  // Descargas rápidas en PDF del mes actual (hasta hoy) y del mes anterior, sin configurar filtros
  const rapidos = [0, -1].map((offset) => ({ offset, ...rangoMes(offset) }));
  const rapido = (offset, tipoRep, r) =>
    generar(`${offset}-${tipoRep}`, tipoRep, { formato: "PDF", desde: r.desde, hasta: r.hasta }, `reporte-${tipoRep}-${r.desde}_a_${r.hasta}.pdf`);

  const estados = tipo === "obras"
    ? Object.entries(ESTADO_OBRA).map(([value, e]) => ({ value, label: e.label }))
    : [{ value: "PENDIENTE", label: "Pendiente" }, { value: "PAGADO", label: "Pagado" }];

  return (
    <AppLayout title="Reportes" subtitle={esGerencia ? "Genera reportes de obras, por técnico, para evaluar carga y desempeño." : "Exporta obras y cobranzas a PDF o Excel con los filtros que necesites."}>
      <Alert>{error}</Alert>
      <section className="adm-card adm-quick" aria-label="Descargas rápidas del mes">
        <h2 className="adm-card-title">Descargas rápidas en PDF</h2>
        <p className="adm-card-sub">Un clic, sin filtros: el reporte del mes actual (hasta hoy) o del mes anterior.</p>
        <div className="adm-quick-grid">
          {rapidos.map((r) => (
            <div key={r.offset} className="adm-quick-col">
              <strong>{r.offset === 0 ? "Mes actual" : "Mes anterior"} · <span className="adm-quick-mes">{r.mes}</span></strong>
              <div className="adm-quick-btns">
                {["obras", "cobranzas"].map((t) => (
                  <button key={t} type="button" className="adm-btn" disabled={descargando !== null} onClick={() => rapido(r.offset, t, r)}>
                    {descargando === `${r.offset}-${t}` ? "Generando..." : `⬇ ${t === "obras" ? "Obras" : "Cobranzas"} (PDF)`}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
      <form className="adm-card" onSubmit={descargar} noValidate>
        <div className="adm-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={tipo === "obras"} onClick={() => { setTipo("obras"); setF((x) => ({ ...x, estado: "" })); }}>Obras</button>
          <button type="button" role="tab" aria-selected={tipo === "cobranzas"} onClick={() => { setTipo("cobranzas"); setF((x) => ({ ...x, estado: "", tecnicoId: "" })); }}>Cobranzas</button>
        </div>
        <div className="adm-form-grid">
          <Field label="Formato" name="formato">
            <select id="f-formato" name="formato" className="adm-select" value={f.formato} onChange={cambiar}>{FORMATOS.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}</select>
          </Field>
          <Field label="Estado" name="estado">
            <select id="f-estado" name="estado" className="adm-select" value={f.estado} onChange={cambiar}>
              <option value="">Todos</option>{estados.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}
            </select>
          </Field>
          <Field label="Desde" name="desde"><input id="f-desde" name="desde" type="date" className="adm-input" value={f.desde} onChange={cambiar} /></Field>
          <Field label="Hasta" name="hasta"><input id="f-hasta" name="hasta" type="date" className="adm-input" value={f.hasta} onChange={cambiar} /></Field>
          <Field label="Cliente" name="clienteId">
            <select id="f-clienteId" name="clienteId" className="adm-select" value={f.clienteId} onChange={cambiar}>
              <option value="">Todos los clientes</option>{clientes.map((c) => <option key={c.id} value={c.id}>{c.razonSocial}</option>)}
            </select>
          </Field>
          {tipo === "obras" && (
            <Field label="Técnico" name="tecnicoId">
              <select id="f-tecnicoId" name="tecnicoId" className="adm-select" value={f.tecnicoId} onChange={cambiar}>
                <option value="">Todos los técnicos</option>{tecnicos.map((t) => <option key={t.id} value={t.id}>{t.nombre ? `${t.nombre} ${t.apellido ?? ""}` : t.username}</option>)}
              </select>
            </Field>
          )}
        </div>
        <div className="adm-modal-actions" style={{ justifyContent: "flex-start" }}>
          <button type="submit" className="adm-btn adm-btn-primary" disabled={descargando !== null}>{descargando === "form" ? "Generando..." : `Descargar ${FORMATOS.find((x) => x.value === f.formato).label}`}</button>
          <button type="button" className="adm-btn" onClick={() => setF({ formato: f.formato, desde: "", hasta: "", estado: "", tecnicoId: "", clienteId: "" })}>Limpiar filtros</button>
        </div>
      </form>
      <section className="adm-card" style={{ marginTop: 16 }} aria-label="Vista previa del reporte">
        <div className="adm-toolbar">
          <div>
            <h2 className="adm-card-title">Vista previa: {tipo === "obras" ? "obras" : "cobranzas"} incluidas en el reporte</h2>
            <p className="adm-card-sub">Se actualiza al cambiar los filtros de arriba. Ajusta las fechas viendo qué datos entran.</p>
          </div>
          <strong>
            {vista.cargando ? "Cargando..." : `${filasVista.length} ${tipo === "obras" ? "obra(s)" : "factura(s)"}`}
            {totalMonto !== null && !vista.cargando && ` · ${clp(totalMonto)}`}
          </strong>
        </div>
        <Alert>{vista.error}</Alert>
        <DataTable columnas={columnasVista} filas={filasVista} cargando={vista.cargando} vacio="No hay datos con esos filtros." />
        {!vista.cargando && vista.filas.length >= 100 && <p className="adm-sub">Se muestran los primeros 100 resultados; el archivo descargado incluye todos los que cumplan el filtro.</p>}
      </section>
      <Toast>{aviso}</Toast>
    </AppLayout>
  );
}

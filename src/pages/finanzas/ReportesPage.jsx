import { useEffect, useState } from "react";
import { getClientes } from "../../api/clientes";
import { descargarReporteCobranzas, descargarReporteObras } from "../../api/reportes";
import { getTecnicos } from "../../api/usuarios";
import { getRole } from "../../api/auth";
import AppLayout from "../../components/AppLayout";
import { Alert, Field, Toast } from "../../components/ui";
import { useToast } from "../../hooks/useToast";
import { descargarBlob, lista } from "../../lib/datos";
import { mensajeError } from "../../lib/errores";
import { hoy } from "../../lib/format";
import { ESTADO_OBRA } from "../../lib/roles";

// FormatoReporte del backend: ajusta estos valores si tu enum usa otros nombres.
const FORMATOS = [{ value: "PDF", label: "PDF", ext: "pdf" }, { value: "EXCEL", label: "Excel", ext: "xlsx" }];

// HU-19 (Finanzas: obras y cobranzas) y HU-20 (Gerencia: reporte por técnico). El archivo solo incluye lo filtrado.
export default function ReportesPage() {
  const esGerencia = getRole() === "GERENCIA";
  const [tipo, setTipo] = useState("obras");
  const [f, setF] = useState({ formato: "PDF", desde: "", hasta: "", estado: "", tecnicoId: "", clienteId: "" });
  const [tecnicos, setTecnicos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [descargando, setDescargando] = useState(false);
  const [error, setError] = useState(null);
  const { aviso, mostrar } = useToast();

  useEffect(() => {
    getTecnicos().then((r) => setTecnicos(lista(r))).catch(() => {});
    getClientes({ size: 100 }).then((r) => setClientes(lista(r))).catch(() => {});
  }, []);

  const cambiar = (e) => { setF((x) => ({ ...x, [e.target.name]: e.target.value })); setError(null); };

  const descargar = async (ev) => {
    ev.preventDefault();
    if (f.desde && f.hasta && f.hasta < f.desde) return setError("La fecha «hasta» no puede ser anterior a «desde».");
    const params = { formato: f.formato };
    ["desde", "hasta", "estado", "clienteId"].forEach((k) => f[k] && (params[k] = f[k]));
    if (tipo === "obras" && f.tecnicoId) params.tecnicoId = f.tecnicoId;
    setDescargando(true); setError(null);
    try {
      const blob = await (tipo === "obras" ? descargarReporteObras(params) : descargarReporteCobranzas(params));
      const ext = FORMATOS.find((x) => x.value === f.formato).ext;
      descargarBlob(blob, `reporte-${tipo}-${hoy()}.${ext}`);
      mostrar("Reporte descargado.");
    } catch (err) {
      // Con responseType blob el error llega como Blob: lo leemos para mostrar el detalle
      let detalle = null;
      try { detalle = JSON.parse(await err.response?.data?.text?.()); } catch { /* sin detalle */ }
      setError(detalle?.detail ?? mensajeError(err, "No se pudo generar el reporte."));
    } finally { setDescargando(false); }
  };

  const estados = tipo === "obras"
    ? Object.entries(ESTADO_OBRA).map(([value, e]) => ({ value, label: e.label }))
    : [{ value: "PENDIENTE", label: "Pendiente" }, { value: "PAGADO", label: "Pagado" }];

  return (
    <AppLayout title="Reportes" subtitle={esGerencia ? "Genera reportes de obras, por técnico, para evaluar carga y desempeño." : "Exporta obras y cobranzas a PDF o Excel con los filtros que necesites."}>
      <form className="adm-card" onSubmit={descargar} noValidate>
        <div className="adm-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={tipo === "obras"} onClick={() => { setTipo("obras"); setF((x) => ({ ...x, estado: "" })); }}>Obras</button>
          <button type="button" role="tab" aria-selected={tipo === "cobranzas"} onClick={() => { setTipo("cobranzas"); setF((x) => ({ ...x, estado: "", tecnicoId: "" })); }}>Cobranzas</button>
        </div>
        <Alert>{error}</Alert>
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
          <button type="submit" className="adm-btn adm-btn-primary" disabled={descargando}>{descargando ? "Generando..." : `Descargar ${FORMATOS.find((x) => x.value === f.formato).label}`}</button>
          <button type="button" className="adm-btn" onClick={() => setF({ formato: f.formato, desde: "", hasta: "", estado: "", tecnicoId: "", clienteId: "" })}>Limpiar filtros</button>
        </div>
      </form>
      <Toast>{aviso}</Toast>
    </AppLayout>
  );
}

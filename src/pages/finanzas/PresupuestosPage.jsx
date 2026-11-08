import { useCallback, useEffect, useState } from "react";
import { aprobarPresupuesto, getPresupuesto, getPresupuestoPdf, getPresupuestos, rechazarPresupuesto } from "../../api/presupuestos";
import { getRole } from "../../api/auth";
import AppLayout from "../../components/AppLayout";
import { Alert, ConfirmModal, DataTable, EstadoPill, Modal, Pager, Toast } from "../../components/ui";
import { useToast } from "../../hooks/useToast";
import { descargarBlob, lista, paginaVacia } from "../../lib/datos";
import { mensajeError } from "../../lib/errores";
import { clp, fecha } from "../../lib/format";
import { ESTADO_PRESUPUESTO } from "../../lib/roles";
import PresupuestoForm from "./PresupuestoForm";

const FILTROS = [{ value: "", label: "Todos los estados" }, ...Object.entries(ESTADO_PRESUPUESTO).map(([value, e]) => ({ value, label: e.label }))];

function Detalle({ id, puedeDecidir, puedeEditar, onClose, onAprobar, onRechazar, onEditar, onPdf }) {
  const [p, setP] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => { let a = true; getPresupuesto(id).then((r) => a && setP(r)).catch((e) => a && setError(mensajeError(e))); return () => { a = false; }; }, [id]);

  return (
    <Modal titulo={p ? `Presupuesto ${p.numeroPresupuesto}` : "Presupuesto"} onClose={onClose} ancho="wide">
      <Alert>{error}</Alert>
      {!p && !error && <p className="adm-sub">Cargando...</p>}
      {p && (
        <>
          <p style={{ marginTop: -8 }}><EstadoPill mapa={ESTADO_PRESUPUESTO} valor={p.estado} /></p>
          <div className="adm-detail">
            <div><h3>CLIENTE</h3><p>{p.clienteRazonSocial ?? p.cliente?.razonSocial ?? "—"}</p></div>
            <div><h3>MONTO TOTAL</h3><p><strong>{clp(p.montoTotal)}</strong></p></div>
            <div><h3>FECHA DE CREACIÓN</h3><p>{fecha(p.fechaCreacion)}</p></div>
            <div><h3>FECHA DE APROBACIÓN</h3><p>{fecha(p.fechaAprobacion)}</p></div>
            {p.motivoRechazo && <div className="wide"><h3>MOTIVO DE RECHAZO</h3><p>{p.motivoRechazo}</p></div>}
          </div>
          <h3 className="adm-section">Ítems</h3>
          <DataTable rowKey="descripcion" columnas={[
            { label: "Descripción", render: (i) => i.descripcion },
            { label: "Monto", num: true, render: (i) => clp(i.monto) },
          ]} filas={p.items ?? []} vacio="Sin ítems." />
          {p.estado === "APROBADO" && <p className="adm-sub" style={{ marginTop: 12 }}>Aprobado: los montos están bloqueados y el PDF institucional está disponible.</p>}
          <div className="adm-modal-actions">
            {p.estado === "APROBADO" && <button className="adm-btn" onClick={() => onPdf(p)}>Descargar PDF</button>}
            {p.estado === "PENDIENTE" && puedeEditar && <button className="adm-btn" onClick={() => onEditar(p)}>Editar</button>}
            {p.estado === "PENDIENTE" && puedeDecidir && <button className="adm-btn adm-btn-danger" onClick={() => onRechazar(p)}>Rechazar</button>}
            {p.estado === "PENDIENTE" && puedeDecidir && <button className="adm-btn adm-btn-primary" onClick={() => onAprobar(p)}>Aprobar</button>}
            <button className="adm-btn" onClick={onClose}>Cerrar</button>
          </div>
        </>
      )}
    </Modal>
  );
}

export default function PresupuestosPage() {
  const rol = getRole();
  const esFinanzas = rol === "FINANZAS";
  const [pagina, setPagina] = useState(0);
  const [data, setData] = useState(paginaVacia);
  const [estado, setEstado] = useState(rol === "GERENCIA" ? "PENDIENTE" : "");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [verId, setVerId] = useState(null);
  const [formulario, setFormulario] = useState(null); // {} nuevo | {id} editar
  const [accion, setAccion] = useState(null); // {tipo:'aprobar'|'rechazar', p}
  const [motivo, setMotivo] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [errorAccion, setErrorAccion] = useState(null);
  const { aviso, mostrar } = useToast();

  const cargar = useCallback(async () => {
    setCargando(true); setError(null);
    try {
      const params = { page: pagina, size: 10 };
      if (estado) params.estado = estado;
      const r = await getPresupuestos(params);
      setData(Array.isArray(r) ? { content: r, page: { totalPages: 1, totalElements: r.length } } : r);
    } catch (e) { setError(mensajeError(e, "No se pudieron cargar los presupuestos.")); }
    finally { setCargando(false); }
  }, [pagina, estado]);
  useEffect(() => { cargar(); }, [cargar]);

  const descargarPdf = async (p) => {
    try { descargarBlob(await getPresupuestoPdf(p.id), `${p.numeroPresupuesto ?? `presupuesto-${p.id}`}.pdf`); }
    catch (e) { mostrar(mensajeError(e, "No se pudo generar el PDF.")); }
  };

  const ejecutar = async () => {
    const { tipo, p } = accion;
    if (tipo === "rechazar" && !motivo.trim()) return setErrorAccion("Escribe el motivo del rechazo.");
    setProcesando(true); setErrorAccion(null);
    try {
      if (tipo === "aprobar") {
        await aprobarPresupuesto(p.id);
        mostrar(`Presupuesto ${p.numeroPresupuesto} aprobado. El PDF institucional ya está disponible.`);
      } else {
        await rechazarPresupuesto(p.id, { motivo: motivo.trim() });
        mostrar(`Presupuesto ${p.numeroPresupuesto} rechazado.`);
      }
      setAccion(null); setVerId(null); setMotivo(""); cargar();
    } catch (e) {
      setErrorAccion(e.response?.status === 403 && tipo === "aprobar"
        ? "Este presupuesto supera el monto umbral: solo Gerencia puede aprobarlo o rechazarlo."
        : mensajeError(e));
    } finally { setProcesando(false); }
  };

  const columnas = [
    { label: "N°", render: (p) => <strong>{p.numeroPresupuesto}</strong> },
    { label: "Cliente", render: (p) => p.clienteRazonSocial ?? p.cliente?.razonSocial ?? "—" },
    { label: "Creado", render: (p) => fecha(p.fechaCreacion) },
    { label: "Monto", num: true, render: (p) => clp(p.montoTotal) },
    { label: "Estado", render: (p) => <EstadoPill mapa={ESTADO_PRESUPUESTO} valor={p.estado} /> },
    { label: "Acciones", acciones: true, render: (p) => <button className="adm-btn adm-btn-sm" onClick={() => setVerId(p.id)}>Ver detalle</button> },
  ];

  return (
    <AppLayout title="Presupuestos"
      subtitle={esFinanzas ? "Registra cotizaciones y apruébalas. Los montos sobre el umbral los decide Gerencia." : "Revisa y decide los presupuestos de alto valor."}
      actions={esFinanzas && <button className="adm-btn adm-btn-primary" onClick={() => setFormulario({})}>＋ Nuevo presupuesto</button>}>
      <section className="adm-card">
        <div className="adm-toolbar">
          <div className="adm-filters">
            <select className="adm-select" aria-label="Filtrar por estado" value={estado} onChange={(e) => { setPagina(0); setEstado(e.target.value); }}>
              {FILTROS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>
        </div>
        <Alert>{error}</Alert>
        <DataTable columnas={columnas} filas={lista(data)} cargando={cargando} vacio="No hay presupuestos con ese filtro." />
        <Pager data={data} pagina={pagina} setPagina={setPagina} unidad="presupuesto(s)" />
      </section>

      {verId && !accion && !formulario && (
        <Detalle id={verId} puedeDecidir={esFinanzas || rol === "GERENCIA"} puedeEditar={esFinanzas} onClose={() => setVerId(null)}
          onPdf={descargarPdf} onEditar={(p) => setFormulario({ id: p.id })}
          onAprobar={(p) => { setErrorAccion(null); setAccion({ tipo: "aprobar", p }); }} onRechazar={(p) => { setErrorAccion(null); setMotivo(""); setAccion({ tipo: "rechazar", p }); }} />
      )}
      {formulario && <PresupuestoForm presupuestoId={formulario.id} onClose={() => setFormulario(null)} onGuardado={(m) => { setFormulario(null); setVerId(null); mostrar(m); cargar(); }} />}
      {accion && (
        <ConfirmModal
          titulo={accion.tipo === "aprobar" ? `Aprobar presupuesto ${accion.p.numeroPresupuesto}` : `Rechazar presupuesto ${accion.p.numeroPresupuesto}`}
          texto={accion.tipo === "aprobar" ? "Al aprobar se bloquean los montos, se genera el PDF institucional y se habilita la creación de la obra." : "El rechazo es definitivo y queda registrado en la auditoría."}
          confirmar={accion.tipo === "aprobar" ? "Aprobar" : "Rechazar"} peligro={accion.tipo === "rechazar"}
          cargando={procesando} error={errorAccion} onCancel={() => setAccion(null)} onConfirm={ejecutar}>
          {accion.tipo === "rechazar" && (
            <div className="adm-field">
              <label htmlFor="f-motivo">Motivo del rechazo</label>
              <textarea id="f-motivo" className="adm-textarea" maxLength={500} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
            </div>
          )}
        </ConfirmModal>
      )}
      <Toast>{aviso}</Toast>
    </AppLayout>
  );
}

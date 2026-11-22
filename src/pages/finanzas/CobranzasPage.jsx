import { useCallback, useEffect, useMemo, useState } from "react";
import { anularPago, emitirFactura, getClientesPendientes, getFacturas, getObrasFacturables, registrarPago } from "../../api/facturas";
import { getRole } from "../../api/auth";
import AppLayout from "../../components/AppLayout";
import { Alert, ConfirmModal, DataTable, EstadoPill, Field, Modal, Pager, Pill, Toast } from "../../components/ui";
import { useForm } from "../../hooks/useForm";
import { useToast } from "../../hooks/useToast";
import { lista, paginaVacia, pick } from "../../lib/datos";
import { erroresPorCampo, mensajeError } from "../../lib/errores";
import { clp, diasAtraso, fecha, hoy } from "../../lib/format";
import { ESTADO_PAGO } from "../../lib/roles";

// COBRANZAS: emitir facturas, registrar pagos y ver qué clientes deben dinero. Las facturas no se borran: un pago equivocado se anula y queda registrado.
const FILTROS = [{ value: "", label: "Todas" }, { value: "PENDIENTE", label: "Pendientes" }, { value: "PAGADO", label: "Pagadas" }];
// Funciones para obtener el nombre de la obra y del cliente aunque el backend los envíe con distinto nombre
const nombreObra = (f) => pick(f, "obraNombre") ?? f.obra?.nombre ?? `Obra #${f.obraId}`;
const nombreCliente = (f) => pick(f, "clienteRazonSocial", "razonSocial", "clienteNombre") ?? f.cliente?.razonSocial ?? "—";

// Ventana para emitir una factura (solo sobre obras finalizadas)
function EmitirModal({ onClose, onEmitida }) {
  const { form, errors, setErrors, handleChange, fillForm } = useForm({ obraId: "", fechaEmision: hoy(), fechaVencimiento: "", monto: "" });
  const [obras, setObras] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [errorServidor, setErrorServidor] = useState(null);

  useEffect(() => {
    let a = true;
    getObrasFacturables().then((r) => a && setObras(lista(r))).catch((e) => a && setErrorServidor(mensajeError(e))).finally(() => a && setCargando(false));
    return () => { a = false; };
  }, []);

  // Obra elegida en el formulario
  const obraSel = obras.find((o) => String(o.obraId) === String(form.obraId));

  // Al elegir la obra, el monto se completa con el saldo por facturar
  const elegirObra = (ev) => {
    const o = obras.find((x) => String(x.obraId) === ev.target.value);
    fillForm({ obraId: ev.target.value, monto: o ? String(o.saldoPorFacturar) : "" });
  };

  // Valida fechas y monto (no puede superar el saldo por facturar) y emite la factura
  const enviar = async (ev) => {
    ev.preventDefault();
    const e = {};
    if (!form.obraId) e.obraId = "Elige una obra finalizada";
    if (!form.fechaEmision) e.fechaEmision = "Indica la fecha de emisión";
    if (!form.fechaVencimiento) e.fechaVencimiento = "Indica la fecha de vencimiento";
    else if (form.fechaVencimiento < form.fechaEmision) e.fechaVencimiento = "No puede ser anterior a la emisión";
    if (!(Number(form.monto) > 0)) e.monto = "Ingresa un monto mayor a 0";
    else if (obraSel && Number(form.monto) > Number(obraSel.saldoPorFacturar)) e.monto = `No puede superar el saldo (${clp(obraSel.saldoPorFacturar)})`;
    if (Object.keys(e).length) return setErrors(e);
    setGuardando(true); setErrorServidor(null);
    try {
      const creada = await emitirFactura({ obraId: Number(form.obraId), fechaEmision: form.fechaEmision, fechaVencimiento: form.fechaVencimiento, monto: Number(form.monto) });
      onEmitida(creada);
    } catch (err) { setErrors(erroresPorCampo(err)); setErrorServidor(mensajeError(err)); }
    finally { setGuardando(false); }
  };

  return (
    <Modal titulo="Emitir factura" descripcion="Solo se factura sobre obras finalizadas con saldo pendiente. El N° de factura se asigna automáticamente y queda en estado Pendiente." onClose={onClose} onSubmit={enviar} bloquear={guardando}>
      <Alert>{errorServidor}</Alert>
      {/* Aviso si no hay obras para facturar */}
      {!cargando && obras.length === 0 && <div className="adm-notice">No hay obras finalizadas con saldo por facturar.</div>}
      <div className="adm-form-grid">
        {/* Campos: obra, monto, fecha de emisión y de vencimiento */}
        <Field label="Obra finalizada" name="obraId" error={errors.obraId} wide>
          <select id="f-obraId" name="obraId" className={`adm-select${errors.obraId ? " error" : ""}`} value={form.obraId} onChange={elegirObra} disabled={cargando}>
            <option value="">{cargando ? "Cargando..." : "Selecciona una obra"}</option>
            {obras.map((o) => <option key={o.obraId} value={o.obraId}>{o.obraNombre} · {o.clienteRazonSocial}</option>)}
          </select>
        </Field>
        {/* Resumen de lo presupuestado, lo ya facturado y el saldo */}
        {obraSel && (
          <div className="adm-notice" style={{ gridColumn: "1 / -1" }}>
            Presupuesto {clp(obraSel.montoPresupuesto)} · Ya facturado {clp(obraSel.totalFacturado)} · <strong>Saldo por facturar {clp(obraSel.saldoPorFacturar)}</strong>
          </div>
        )}
        <Field label="Monto ($ CLP)" name="monto" error={errors.monto}>
          <input id="f-monto" name="monto" type="number" min={0} max={obraSel?.saldoPorFacturar} step={1} inputMode="numeric" className={`adm-input${errors.monto ? " error" : ""}`} value={form.monto} onChange={handleChange} autoComplete="off" />
        </Field>
        <Field label="Fecha de emisión" name="fechaEmision" error={errors.fechaEmision}>
          <input id="f-fechaEmision" name="fechaEmision" type="date" className={`adm-input${errors.fechaEmision ? " error" : ""}`} value={form.fechaEmision} onChange={handleChange} />
        </Field>
        <Field label="Fecha de vencimiento" name="fechaVencimiento" error={errors.fechaVencimiento}>
          <div className="adm-row">
            <input id="f-fechaVencimiento" name="fechaVencimiento" type="date" className={`adm-input${errors.fechaVencimiento ? " error" : ""}`} value={form.fechaVencimiento} onChange={handleChange} />
            <button type="button" className="adm-btn adm-btn-sm" onClick={() => { const d = new Date(`${form.fechaEmision}T00:00:00`); d.setDate(d.getDate() + 30); fillForm({ fechaVencimiento: d.toISOString().slice(0, 10) }); }}>+30 días</button>
          </div>
        </Field>
      </div>
      <div className="adm-modal-actions">
        <button type="button" className="adm-btn" onClick={onClose} disabled={guardando}>Cancelar</button>
        <button type="submit" className="adm-btn adm-btn-primary" disabled={guardando || cargando || obras.length === 0}>{guardando ? "Emitiendo..." : "Emitir factura"}</button>
      </div>
    </Modal>
  );
}

// Ventana para registrar el pago de una factura
function PagoModal({ factura, onClose, onGuardado }) {
  const [fechaPago, setFechaPago] = useState(hoy());
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  // HU-30: avisa si la fecha de pago es anterior a la de emisión
  const anterior = fechaPago && factura.fechaEmision && fechaPago < factura.fechaEmision; // HU-30
  const guardar = async (ev) => {
    ev.preventDefault();
    if (!fechaPago || anterior) return;
    setGuardando(true); setError(null);
    try { await registrarPago(factura.id, { fechaPago }); onGuardado(`Pago de la factura ${factura.numeroFactura} registrado.`); }
    catch (e) { setError(mensajeError(e)); }
    finally { setGuardando(false); }
  };
  return (
    <Modal titulo={`Registrar pago · factura ${factura.numeroFactura}`} descripcion={`Emitida el ${fecha(factura.fechaEmision)} por ${clp(factura.monto)}.`} onClose={onClose} onSubmit={guardar} bloquear={guardando}>
      <Alert>{error}</Alert>
      {/* Campo de fecha de pago */}
      <Field label="Fecha de pago" name="fechaPago">
        <input id="f-fechaPago" type="date" className={`adm-input${anterior ? " error" : ""}`} value={fechaPago} onChange={(e) => setFechaPago(e.target.value)} />
      </Field>
      {/* Aviso de fecha incorrecta (no deja guardar) */}
      {anterior && <div className="adm-notice" role="alert" style={{ marginTop: 12 }}>La fecha de pago es anterior a la fecha de emisión ({fecha(factura.fechaEmision)}). Corrígela para poder guardar.</div>}
      <div className="adm-modal-actions">
        <button type="button" className="adm-btn" onClick={onClose} disabled={guardando}>Cancelar</button>
        <button type="submit" className="adm-btn adm-btn-primary" disabled={guardando || anterior || !fechaPago}>{guardando ? "Guardando..." : "Registrar pago"}</button>
      </div>
    </Modal>
  );
}

// Pestaña de facturas: lista, filtro por estado de pago, emitir, pagar y anular
function Facturas({ esFinanzas, mostrar }) {
  const [pagina, setPagina] = useState(0);
  const [data, setData] = useState(paginaVacia);
  const [estadoPago, setEstadoPago] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [emitir, setEmitir] = useState(false);
  const [pago, setPago] = useState(null);
  const [anular, setAnular] = useState(null);
  const [motivo, setMotivo] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [errorAnular, setErrorAnular] = useState(null);

  // Pide las facturas al backend
  const cargar = useCallback(async () => {
    setCargando(true); setError(null);
    try {
      const params = { page: pagina, size: 10 };
      if (estadoPago) params.estadoPago = estadoPago;
      const r = await getFacturas(params);
      setData(Array.isArray(r) ? { content: r, page: { totalPages: 1, totalElements: r.length } } : r);
    } catch (e) { setError(mensajeError(e, "No se pudieron cargar las facturas.")); }
    finally { setCargando(false); }
  }, [pagina, estadoPago]);
  useEffect(() => { cargar(); }, [cargar]);

  // Anula un pago: exige motivo y la factura vuelve a Pendiente (queda en la auditoría)
  const ejecutarAnulacion = async () => {
    if (!motivo.trim()) return setErrorAnular("El motivo es obligatorio: queda registrado en la auditoría.");
    setProcesando(true); setErrorAnular(null);
    try { await anularPago(anular.id, { motivo: motivo.trim() }); mostrar(`Pago anulado. La factura ${anular.numeroFactura} volvió a Pendiente.`); setAnular(null); setMotivo(""); cargar(); }
    catch (e) { setErrorAnular(mensajeError(e)); }
    finally { setProcesando(false); }
  };

  // Columnas de la tabla; los botones de acción solo los ve Finanzas
  const columnas = [
    { label: "N° factura", render: (f) => <strong>{f.numeroFactura}</strong> },
    { label: "Obra", render: (f) => nombreObra(f) },
    { label: "Cliente", render: (f) => nombreCliente(f) },
    { label: "Emisión", render: (f) => fecha(f.fechaEmision) },
    { label: "Vence", render: (f) => fecha(f.fechaVencimiento) },
    { label: "Monto", num: true, render: (f) => clp(f.monto) },
    { label: "Estado", render: (f) => (
      <>
        <EstadoPill mapa={ESTADO_PAGO} valor={f.estadoPago} />{" "}
        {f.anulada && <Pill tono="warn">Anulada</Pill>}
        {f.estadoPago === "PENDIENTE" && diasAtraso(f.fechaVencimiento) > 0 && <Pill tono="bad">{diasAtraso(f.fechaVencimiento)} d de atraso</Pill>}
      </>
    ) },
    ...(esFinanzas ? [{ label: "Acciones", acciones: true, render: (f) => (
      <>
        {f.estadoPago === "PENDIENTE" && !f.anulada && <button className="adm-btn adm-btn-sm adm-btn-primary" onClick={() => setPago(f)}>Registrar pago</button>}
        {f.estadoPago === "PAGADO" && <button className="adm-btn adm-btn-sm adm-btn-danger" onClick={() => { setErrorAnular(null); setMotivo(""); setAnular(f); }}>Anular pago</button>}
      </>
    ) }] : []),
  ];

  return (
    <>
      {/* Filtro de estado y botón para emitir factura */}
      <div className="adm-toolbar">
        <div className="adm-filters">
          <select className="adm-select" aria-label="Filtrar por estado de pago" value={estadoPago} onChange={(e) => { setPagina(0); setEstadoPago(e.target.value); }}>
            {FILTROS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>
        {esFinanzas && <button className="adm-btn adm-btn-primary" onClick={() => setEmitir(true)}>＋ Emitir factura</button>}
      </div>
      <Alert>{error}</Alert>
      <DataTable columnas={columnas} filas={lista(data)} cargando={cargando} vacio="No hay facturas con ese filtro." />
      <Pager data={data} pagina={pagina} setPagina={setPagina} unidad="factura(s)" />
      {/* Ventanas: registrar pago, emitir factura y anular pago */}
      {pago && <PagoModal factura={pago} onClose={() => setPago(null)} onGuardado={(msg) => { setPago(null); mostrar(msg); cargar(); }} />}
      {emitir && <EmitirModal onClose={() => setEmitir(false)} onEmitida={() => { setEmitir(false); mostrar("Factura emitida en estado Pendiente."); cargar(); }} />}
      {/* Ventana de confirmación de anulación */}
      {anular && (
        <ConfirmModal titulo={`Anular pago · factura ${anular.numeroFactura}`} texto="El pago no se elimina: queda marcado como anulado con tu usuario, la fecha y el motivo, y la factura vuelve a Pendiente."
          confirmar="Anular pago" peligro cargando={procesando} error={errorAnular} onCancel={() => setAnular(null)} onConfirm={ejecutarAnulacion}>
          <div className="adm-field">
            <label htmlFor="f-motivo">Motivo de la anulación</label>
            <textarea id="f-motivo" className="adm-textarea" maxLength={500} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ej: Pago registrado en la factura equivocada" />
          </div>
        </ConfirmModal>
      )}
    </>
  );
}

// Pestaña de clientes con deuda: monto adeudado y días de atraso
function ClientesPendientes() {
  const [filas, setFilas] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let a = true;
    getClientesPendientes().then((r) => a && setFilas(lista(r))).catch((e) => a && setError(mensajeError(e, "No se pudo cargar el listado."))).finally(() => a && setCargando(false));
    return () => { a = false; };
  }, []);

  // Aplica el buscador
  const visibles = useMemo(() => {
    const q = busqueda.trim().toLocaleLowerCase("es");
    return filas.filter((c) => !q || `${nombreCliente(c)} ${c.rut ?? c.clienteRut ?? ""}`.toLocaleLowerCase("es").includes(q));
  }, [filas, busqueda]);
  // Suma de lo que deben los clientes mostrados
  const totalDeuda = visibles.reduce((s, c) => s + Number(pick(c, "montoAdeudado", "montoPendiente", "deuda", "monto") ?? 0), 0);

  const columnas = [
    { label: "Cliente", render: (c) => <strong>{nombreCliente(c)}</strong> },
    { label: "Facturas pendientes", num: true, render: (c) => pick(c, "facturasPendientes", "cantidadFacturas", "cantidad") ?? "—" },
    { label: "Monto adeudado", num: true, render: (c) => clp(pick(c, "montoAdeudado", "montoPendiente", "deuda", "monto")) },
    { label: "Días de atraso", num: true, render: (c) => { const d = Number(pick(c, "diasAtraso", "diasDeAtraso", "maxDiasAtraso") ?? 0); return <Pill tono={d > 0 ? "bad" : "warn"}>{d} día(s)</Pill>; } },
  ];

  return (
    <>
      {/* Buscador y total adeudado */}
      <div className="adm-toolbar">
        <div className="adm-filters"><input className="adm-input" aria-label="Buscar cliente" placeholder="Buscar cliente..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} /></div>
        <strong>Total adeudado: <span style={{ color: "var(--bad)" }}>{clp(totalDeuda)}</span></strong>
      </div>
      <Alert>{error}</Alert>
      <DataTable rowKey="clienteId" columnas={columnas} filas={visibles} cargando={cargando} vacio="No hay clientes con pagos pendientes. 🎉" />
    </>
  );
}

// Pantalla con dos pestañas: Facturas y Clientes con pago pendiente
export default function CobranzasPage() {
  const esFinanzas = getRole() === "FINANZAS";
  const [tab, setTab] = useState("facturas");
  const { aviso, mostrar } = useToast();
  return (
    <AppLayout title="Cobranzas" subtitle={esFinanzas ? "Emite facturas sobre obras finalizadas, registra pagos y corrige errores sin borrar historial." : "Consulta de facturas y clientes con pagos pendientes para priorizar la cobranza."}>
      <section className="adm-card">
        {/* Pestañas */}
        <div className="adm-tabs" role="tablist">
          <button role="tab" aria-selected={tab === "facturas"} onClick={() => setTab("facturas")}>Facturas</button>
          <button role="tab" aria-selected={tab === "pendientes"} onClick={() => setTab("pendientes")}>Clientes con pagos pendientes</button>
        </div>
        {/* Muestra la pestaña elegida */}
        {tab === "facturas" ? <Facturas esFinanzas={esFinanzas} mostrar={mostrar} /> : <ClientesPendientes />}
      </section>
      <Toast>{aviso}</Toast>
    </AppLayout>
  );
}
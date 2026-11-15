import { useEffect, useState } from "react";
import { createPresupuesto, getPresupuesto, updatePresupuesto } from "../../api/presupuestos";
import ClienteSelect from "../../components/ClienteSelect";
import { Alert, Field, Modal } from "../../components/ui";
import { mensajeError } from "../../lib/errores";
import { clp } from "../../lib/format";

const itemVacio = () => ({ descripcion: "", monto: "" });

// Crea o edita (solo PENDIENTE) un presupuesto: cliente + al menos un ítem (HU-01). El total se calcula solo.
export default function PresupuestoForm({ presupuestoId, onClose, onGuardado }) {
  const [cliente, setCliente] = useState(null);
  const [items, setItems] = useState([itemVacio()]);
  const [cargando, setCargando] = useState(Boolean(presupuestoId));
  const [guardando, setGuardando] = useState(false);
  const [errorServidor, setErrorServidor] = useState(null);
  const [errores, setErrores] = useState({});

  useEffect(() => {
    if (!presupuestoId) return undefined;
    let activo = true;
    getPresupuesto(presupuestoId).then((p) => {
      if (!activo) return;
      setCliente({ id: p.clienteId ?? p.cliente?.id, razonSocial: p.clienteRazonSocial ?? p.cliente?.razonSocial, rut: p.clienteRut ?? p.cliente?.rut ?? "" });
      setItems((p.items?.length ? p.items : [itemVacio()]).map((i) => ({ descripcion: i.descripcion, monto: i.monto })));
    }).catch((e) => activo && setErrorServidor(mensajeError(e))).finally(() => activo && setCargando(false));
    return () => { activo = false; };
  }, [presupuestoId]);

  const total = items.reduce((s, i) => s + (Number(i.monto) || 0), 0);
  const cambiarItem = (idx, campo, valor) => { setItems((l) => l.map((it, i) => (i === idx ? { ...it, [campo]: valor } : it))); setErrores((e) => ({ ...e, items: null })); };

  const enviar = async (ev) => {
    ev.preventDefault();
    const e = {};
    if (!cliente) e.cliente = "Selecciona un cliente";
    if (items.some((i) => !i.descripcion.trim() || !(Number(i.monto) > 0))) e.items = "Cada ítem necesita descripción y un monto mayor a 0";
    if (Object.keys(e).length) return setErrores(e);
    setGuardando(true); setErrorServidor(null);
    const payload = { clienteId: cliente.id, items: items.map((i) => ({ descripcion: i.descripcion.trim(), monto: Number(i.monto) })) };
    try {
      const r = presupuestoId ? await updatePresupuesto(presupuestoId, payload) : await createPresupuesto(payload);
      onGuardado(presupuestoId ? "Presupuesto actualizado." : `Presupuesto ${r?.numeroPresupuesto ?? ""} registrado como Pendiente.`.replace("  ", " "));
    } catch (err) { setErrorServidor(mensajeError(err)); }
    finally { setGuardando(false); }
  };

  return (
    <Modal titulo={presupuestoId ? "Editar presupuesto" : "Nuevo presupuesto"} descripcion="Quedará en estado Pendiente hasta que sea aprobado." onClose={onClose} onSubmit={enviar} ancho="wide" bloquear={guardando}>
      <Alert>{errorServidor}</Alert>
      {cargando ? <p className="adm-sub">Cargando presupuesto...</p> : (
        <>
          <Field label="Cliente" name="cliente" error={errores.cliente}>
            <ClienteSelect value={cliente} onChange={(c) => { setCliente(c); setErrores((x) => ({ ...x, cliente: null })); }} error={errores.cliente} />
          </Field>
          <h3 className="adm-section" style={{ marginTop: 20 }}>Ítems de la cotización</h3>
          <div className="adm-items">
            {items.map((it, idx) => (
              <div className="adm-item" key={idx}>
                <input className="adm-input" aria-label={`Descripción del ítem ${idx + 1}`} placeholder="Descripción (material, servicio...)" maxLength={300} value={it.descripcion} onChange={(e) => cambiarItem(idx, "descripcion", e.target.value)} />
                <input className="adm-input" aria-label={`Monto del ítem ${idx + 1}`} type="number" inputMode="numeric" min="0" step="1" placeholder="Monto $" value={it.monto} onChange={(e) => cambiarItem(idx, "monto", e.target.value)} />
                <button type="button" className="adm-btn adm-btn-sm" aria-label={`Quitar ítem ${idx + 1}`} disabled={items.length === 1} onClick={() => setItems((l) => l.filter((_, i) => i !== idx))}>✕</button>
              </div>
            ))}
          </div>
          {errores.items && <small role="alert" style={{ color: "var(--bad)" }}>{errores.items}</small>}
          <p><button type="button" className="adm-btn adm-btn-sm" style={{ marginTop: 10 }} onClick={() => setItems((l) => [...l, itemVacio()])}>＋ Agregar ítem</button></p>
          <div className="adm-total"><span>Monto total</span><strong>{clp(total)}</strong></div>
        </>
      )}
      <div className="adm-modal-actions">
        <button type="button" className="adm-btn" onClick={onClose} disabled={guardando}>Cancelar</button>
        <button type="submit" className="adm-btn adm-btn-primary" disabled={guardando || cargando}>{guardando ? "Guardando..." : "Guardar presupuesto"}</button>
      </div>
    </Modal>
  );
}

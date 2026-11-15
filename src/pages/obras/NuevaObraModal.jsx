import { useEffect, useState } from "react";
import { createObra } from "../../api/obras";
import { getAprobados } from "../../api/presupuestos";
import { getTiposServicio } from "../../api/tiposServicio";
import { getTecnicos } from "../../api/usuarios";
import { Alert, Field, Modal } from "../../components/ui";
import { useForm } from "../../hooks/useForm";
import { lista } from "../../lib/datos";
import { erroresPorCampo, mensajeError } from "../../lib/errores";
import { hoy } from "../../lib/format";

// Hallazgo UX 1: el supervisor NO escribe montos; elige de una lista de presupuestos aprobados sin obra.
export default function NuevaObraModal({ onClose, onCreada }) {
  const { form, errors, setErrors, handleChange } = useForm({ presupuestoId: "", nombre: "", descripcion: "", tipoServicioId: "", tecnicoId: "", fechaInicio: hoy() });
  const [opciones, setOpciones] = useState({ presupuestos: [], tipos: [], tecnicos: [] });
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [errorServidor, setErrorServidor] = useState(null);

  useEffect(() => {
    let activo = true;
    Promise.all([getAprobados(), getTiposServicio(false), getTecnicos()])
      .then(([p, t, tec]) => activo && setOpciones({ presupuestos: lista(p), tipos: lista(t), tecnicos: lista(tec) }))
      .catch((e) => activo && setErrorServidor(mensajeError(e, "No se pudieron cargar las listas.")))
      .finally(() => activo && setCargando(false));
    return () => { activo = false; };
  }, []);

  const enviar = async (ev) => {
    ev.preventDefault();
    const e = {};
    if (!form.presupuestoId) e.presupuestoId = "Elige un presupuesto aprobado";
    if (!form.nombre.trim()) e.nombre = "El nombre es obligatorio";
    else if (form.nombre.trim().length > 30) e.nombre = "Máximo 30 caracteres";
    if (!form.tipoServicioId) e.tipoServicioId = "Elige un tipo de servicio";
    if (!form.tecnicoId) e.tecnicoId = "Asigna un técnico responsable";
    if (!form.fechaInicio) e.fechaInicio = "Indica la fecha de inicio";
    if (Object.keys(e).length) return setErrors(e);
    setGuardando(true); setErrorServidor(null);
    try {
      const creada = await createObra({
        presupuestoId: Number(form.presupuestoId), nombre: form.nombre.trim(), descripcion: form.descripcion.trim() || null,
        tipoServicioId: Number(form.tipoServicioId), tecnicoId: Number(form.tecnicoId), fechaInicio: form.fechaInicio,
      });
      onCreada(creada);
    } catch (err) { setErrors(erroresPorCampo(err)); setErrorServidor(mensajeError(err)); }
    finally { setGuardando(false); }
  };

  const sinPresupuestos = !cargando && opciones.presupuestos.length === 0;
  const nombreTec = (t) => (t.nombre ? `${t.nombre} ${t.apellido ?? ""}`.trim() : t.username);

  return (
    <Modal titulo="Nueva obra" descripcion="La obra nace de un presupuesto aprobado. El cliente se toma del presupuesto." onClose={onClose} onSubmit={enviar} bloquear={guardando}>
      <Alert>{errorServidor}</Alert>
      {sinPresupuestos && <div className="adm-notice">No hay presupuestos aprobados pendientes de obra. Finanzas debe aprobar un presupuesto primero.</div>}
      <div className="adm-form-grid">
        <Field label="Presupuesto aprobado" name="presupuestoId" error={errors.presupuestoId} wide>
          <select id="f-presupuestoId" name="presupuestoId" className={`adm-select${errors.presupuestoId ? " error" : ""}`} value={form.presupuestoId} onChange={handleChange} disabled={cargando}>
            <option value="">{cargando ? "Cargando..." : "Selecciona un presupuesto"}</option>
            {opciones.presupuestos.map((p) => <option key={p.id} value={p.id}>{p.numeroPresupuesto} · {p.clienteRazonSocial ?? p.cliente?.razonSocial ?? "Cliente"}</option>)}
          </select>
        </Field>
        <Field label="Nombre de la obra" name="nombre" error={errors.nombre} hint="Máximo 30 caracteres">
          <input id="f-nombre" name="nombre" maxLength={30} className={`adm-input${errors.nombre ? " error" : ""}`} value={form.nombre} onChange={handleChange} autoComplete="off" />
        </Field>
        <Field label="Fecha de inicio" name="fechaInicio" error={errors.fechaInicio}>
          <input id="f-fechaInicio" name="fechaInicio" type="date" className={`adm-input${errors.fechaInicio ? " error" : ""}`} value={form.fechaInicio} onChange={handleChange} />
        </Field>
        <Field label="Tipo de servicio" name="tipoServicioId" error={errors.tipoServicioId}>
          <select id="f-tipoServicioId" name="tipoServicioId" className={`adm-select${errors.tipoServicioId ? " error" : ""}`} value={form.tipoServicioId} onChange={handleChange}>
            <option value="">Selecciona un tipo</option>
            {opciones.tipos.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
          </select>
        </Field>
        <Field label="Técnico responsable" name="tecnicoId" error={errors.tecnicoId}>
          <select id="f-tecnicoId" name="tecnicoId" className={`adm-select${errors.tecnicoId ? " error" : ""}`} value={form.tecnicoId} onChange={handleChange}>
            <option value="">Selecciona un técnico</option>
            {opciones.tecnicos.map((t) => <option key={t.id} value={t.id}>{nombreTec(t)}</option>)}
          </select>
        </Field>
        <Field label="Descripción (opcional)" name="descripcion" error={errors.descripcion} wide>
          <textarea id="f-descripcion" name="descripcion" maxLength={500} className="adm-textarea" value={form.descripcion} onChange={handleChange} />
        </Field>
      </div>
      <div className="adm-modal-actions">
        <button type="button" className="adm-btn" onClick={onClose} disabled={guardando}>Cancelar</button>
        <button type="submit" className="adm-btn adm-btn-primary" disabled={guardando || cargando || sinPresupuestos}>{guardando ? "Creando..." : "Crear obra"}</button>
      </div>
    </Modal>
  );
}

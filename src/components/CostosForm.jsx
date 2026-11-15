import { useEffect, useState } from "react";
import { getCostos, registrarCostos } from "../api/obras";
import { mensajeError } from "../lib/errores";
import { Alert, Field } from "./ui";

// Registro de horas técnicas y materiales de una obra (HU-04).
// ocultarValorHora: el Técnico no ve ni edita montos de mano de obra; el valor existente se conserva al guardar.
export default function CostosForm({ obraId, ocultarValorHora, onGuardado, onCancel }) {
  const [form, setForm] = useState({ materiales: "", horasTecnicas: "", valorHora: "" });
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [errores, setErrores] = useState({});

  useEffect(() => {
    let activo = true;
    getCostos(obraId)
      .then((c) => { if (activo && c) setForm({ materiales: c.materiales ?? "", horasTecnicas: c.horasTecnicas ?? "", valorHora: c.valorHora ?? "" }); })
      .catch(() => { /* aún no hay costos registrados */ })
      .finally(() => activo && setCargando(false));
    return () => { activo = false; };
  }, [obraId]);

  const cambiar = (e) => { setForm((f) => ({ ...f, [e.target.name]: e.target.value })); setErrores((x) => ({ ...x, [e.target.name]: null })); };

  const guardar = async (ev) => {
    ev.preventDefault();
    const e = {};
    if (form.materiales === "" || Number(form.materiales) < 0) e.materiales = "Ingresa el costo de materiales (0 si no hubo)";
    if (form.horasTecnicas === "" || Number(form.horasTecnicas) < 0) e.horasTecnicas = "Ingresa las horas trabajadas";
    if (!ocultarValorHora && (form.valorHora === "" || Number(form.valorHora) < 0)) e.valorHora = "Ingresa el valor por hora";
    if (Object.keys(e).length) return setErrores(e);
    setGuardando(true); setError(null);
    try {
      const payload = { materiales: Number(form.materiales), horasTecnicas: Number(form.horasTecnicas) };
      if (form.valorHora !== "") payload.valorHora = Number(form.valorHora);
      else if (!ocultarValorHora) payload.valorHora = 0;
      await registrarCostos(obraId, payload);
      onGuardado?.();
    } catch (err) { setError(mensajeError(err)); }
    finally { setGuardando(false); }
  };

  if (cargando) return <p className="adm-sub">Cargando costos...</p>;
  return (
    <form onSubmit={guardar} noValidate>
      <Alert>{error}</Alert>
      <div className="adm-form-grid">
        <Field label="Horas trabajadas" name="horasTecnicas" error={errores.horasTecnicas}>
          <input id="f-horasTecnicas" name="horasTecnicas" type="number" inputMode="decimal" min="0" step="0.5" className={`adm-input${errores.horasTecnicas ? " error" : ""}`} value={form.horasTecnicas} onChange={cambiar} />
        </Field>
        <Field label="Materiales utilizados ($ CLP)" name="materiales" error={errores.materiales}>
          <input id="f-materiales" name="materiales" type="number" inputMode="numeric" min="0" step="1" className={`adm-input${errores.materiales ? " error" : ""}`} value={form.materiales} onChange={cambiar} />
        </Field>
        {!ocultarValorHora && (
          <Field label="Valor hora técnica ($ CLP)" name="valorHora" error={errores.valorHora} wide>
            <input id="f-valorHora" name="valorHora" type="number" inputMode="numeric" min="0" step="1" className={`adm-input${errores.valorHora ? " error" : ""}`} value={form.valorHora} onChange={cambiar} />
          </Field>
        )}
      </div>
      <div className="adm-modal-actions">
        {onCancel && <button type="button" className="adm-btn" onClick={onCancel}>Cancelar</button>}
        <button type="submit" className="adm-btn adm-btn-primary" disabled={guardando}>{guardando ? "Guardando..." : "Guardar costos"}</button>
      </div>
    </form>
  );
}

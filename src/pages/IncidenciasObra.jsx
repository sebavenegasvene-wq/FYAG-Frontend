import { useCallback, useEffect, useState } from "react";
import { getIncidencias, registrarIncidencia } from "../api/incidencias";
import { mensajeError } from "../lib/errores";
import { TIPO_INCIDENCIA } from "../lib/incidencias";
import { Alert, EstadoPill } from "./ui";

// (Copia sin usar de components/IncidenciasObra.jsx; la app usa la de components.) Formatea fecha y hora
const cuando = (iso) => new Date(iso).toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" });

// Historial de novedades de una obra y, si corresponde, formulario para dejar una nueva.
// NOVEDADES DE UNA OBRA: lista de novedades y formulario para agregar una.
export default function IncidenciasObra({ obraId, puedeRegistrar, onRegistrada }) {
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);
  const [tipo, setTipo] = useState("COMENTARIO");
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);

  // Pide las novedades al backend
  const cargar = useCallback(async () => {
    try { setItems(await getIncidencias(obraId)); setError(null); }
    catch (e) { setError(mensajeError(e, "No se pudieron cargar las novedades.")); }
  }, [obraId]);
  useEffect(() => { cargar(); }, [cargar]);

  // Valida que haya texto, lo envía y recarga la lista
  const enviar = async () => {
    if (!texto.trim()) return setError("Escribe qué ocurrió.");
    setEnviando(true); setError(null);
    try {
      await registrarIncidencia(obraId, { tipo, texto: texto.trim() });
      setTexto(""); setTipo("COMENTARIO");
      await cargar();
      onRegistrada?.("Novedad registrada. Se avisó al responsable.");
    } catch (e) { setError(mensajeError(e)); }
    finally { setEnviando(false); }
  };

  return (
    <section aria-label="Novedades de la obra">
      <Alert>{error}</Alert>
      {items === null && !error && <p className="adm-sub">Cargando novedades...</p>}
      {items?.length === 0 && <p className="adm-sub">Aún no hay novedades en esta obra.</p>}
      {items?.length > 0 && (
        <ul className="adm-inc-list">
          {items.map((i) => (
            <li key={i.id} className="adm-inc">
              <header>
                <EstadoPill mapa={TIPO_INCIDENCIA} valor={i.tipo} />
                <small>{i.autorNombre} · {cuando(i.fecha)}</small>
              </header>
              <p>{i.texto}</p>
            </li>
          ))}
        </ul>
      )}
      {puedeRegistrar && (
        <>
          <div className="adm-field">
            <label htmlFor="inc-tipo">Tipo de novedad</label>
            <select id="inc-tipo" className="adm-select" value={tipo} onChange={(e) => setTipo(e.target.value)}>
              {Object.entries(TIPO_INCIDENCIA).map(([v, t]) => <option key={v} value={v}>{t.label}</option>)}
            </select>
          </div>
          <div className="adm-field">
            <label htmlFor="inc-texto">¿Qué ocurrió?</label>
            <textarea id="inc-texto" className="adm-textarea" maxLength={500} value={texto} onChange={(e) => setTexto(e.target.value)}
              placeholder="Ej: El encargado del cliente no estaba en la visita agendada" />
          </div>
          <button type="button" className="adm-btn adm-btn-primary" onClick={enviar} disabled={enviando}>{enviando ? "Enviando..." : "Registrar novedad"}</button>
        </>
      )}
    </section>
  );
}
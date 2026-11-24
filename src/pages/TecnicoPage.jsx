import { useCallback, useEffect, useState } from "react";
import { getObras } from "../api/obras";
import AppLayout from "../components/AppLayout";
import CostosForm from "../components/CostosForm";
import { SeguimientoDeObra } from "../components/Seguimiento";
import { Alert, EstadoPill, Modal, Toast } from "../components/ui";
import { useToast } from "../hooks/useToast";
import { lista } from "../lib/datos";
import { mensajeError } from "../lib/errores";
import { fecha } from "../lib/format";
import { ESTADO_OBRA } from "../lib/roles";
import IncidenciasObra from "../components/IncidenciasObra";
import { ESTADOS_ABIERTOS } from "../lib/incidencias";
// PANTALLA DEL TÉCNICO: solo ve las obras que le asignaron (el backend las filtra), sin montos. Puede registrar horas/materiales y dejar novedades.
const FILTROS = [{ value: "", label: "Todas" }, ...Object.entries(ESTADO_OBRA).map(([value, e]) => ({ value, label: e.label }))];

// Vista móvil del técnico: solo sus obras (el backend filtra), formato tarjeta, SIN buscador
// (hallazgo UX 3) y sin ningún monto. Solo registra horas y materiales.
// Vista pensada para el celular: obras en tarjetas y sin buscador
export default function TecnicoPage() {
  // Estados: obras, filtro de estado, y qué ventana (modal) está abierta
  const [obras, setObras] = useState([]);
  const [estado, setEstado] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [registrando, setRegistrando] = useState(null);
  const [viendo, setViendo] = useState(null);
  const [comentando, setComentando] = useState(null);
  const { aviso, mostrar } = useToast();

  // Pide las obras del técnico al backend
  const cargar = useCallback(async () => {
    setCargando(true); setError(null);
    try { setObras(lista(await getObras({ size: 50 }))); }
    catch (e) { setError(mensajeError(e, "No se pudieron cargar tus obras.")); }
    finally { setCargando(false); }
  }, []);
  useEffect(() => { cargar(); }, [cargar]);

  // Aplica el filtro de estado elegido
  const visibles = estado ? obras.filter((o) => o.estado === estado) : obras;

  return (
    <AppLayout title="Mis obras" subtitle="Aquí ves solo las obras que te asignaron. Registra tus horas y materiales al terminar el trabajo.">
      {/* Botones para filtrar por estado */}
      <div className="adm-chips" role="group" aria-label="Filtrar por estado">
        {FILTROS.map((f) => <button key={f.value} className="adm-chip" aria-pressed={estado === f.value} onClick={() => setEstado(f.value)}>{f.label}</button>)}
      </div>
      <Alert>{error}</Alert>
      {cargando && <p className="adm-sub">Cargando tus obras...</p>}
      {!cargando && visibles.length === 0 && !error && <div className="adm-card"><p className="adm-sub">No tienes obras {estado ? "en ese estado" : "asignadas"} por ahora.</p></div>}
      <div className="adm-obra-list">
        {/* Una tarjeta por obra */}
        {visibles.map((o) => (
          <article key={o.id} className={`adm-obra ${ESTADO_OBRA[o.estado]?.tono ?? ""}`}>
            <div className="adm-row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
              <h3>{o.nombre}</h3>
              <EstadoPill mapa={ESTADO_OBRA} valor={o.estado} />
            </div>
            <p>{o.clienteRazonSocial}</p>
            <dl>
              <dt>Servicio</dt><dd>{o.tipoServicioNombre}</dd>
              <dt>Inicio</dt><dd>{fecha(o.fechaInicio)}</dd>
              {o.fechaTermino && <><dt>Término</dt><dd>{fecha(o.fechaTermino)}</dd></>}
            </dl>
            {o.descripcion && <p>{o.descripcion}</p>}
            {o.motivoSuspension && <p><strong>Suspendida:</strong> {o.motivoSuspension}</p>}
            {/* Solo se pueden registrar horas si la obra está En proceso */}
            {o.estado === "EN_PROCESO"
              ? <button className="adm-btn adm-btn-primary" onClick={() => setRegistrando(o)}>Registrar horas y materiales</button>
              : <small className="adm-sub">Esta obra ya no admite registro de horas.</small>}
            <button className="adm-btn" style={{ marginTop: 8 }} onClick={() => setViendo(o)}>Ver seguimiento</button>
            <button className="adm-btn" style={{ marginTop: 8 }} onClick={() => setComentando(o)}>Novedades y comentarios</button>
          </article>
        ))}
      </div>
      {/* Ventana para registrar horas y materiales (sin ver valor hora) */}
      {registrando && (
        <Modal titulo={`Horas y materiales · ${registrando.nombre}`} descripcion="Anota lo que usaste en esta obra. Puedes volver a editarlo mientras siga en proceso." onClose={() => setRegistrando(null)}>
          <CostosForm obraId={registrando.id} ocultarValorHora onCancel={() => setRegistrando(null)} onGuardado={() => { setRegistrando(null); mostrar("Horas y materiales guardados."); }} />
        </Modal>
      )}
      {/* Ventana con el seguimiento de la obra */}
      {viendo && (
        <Modal titulo={`Seguimiento · ${viendo.nombre}`} onClose={() => setViendo(null)}>
          <SeguimientoDeObra obraId={viendo.id} />
          <div className="adm-modal-actions"><button className="adm-btn" onClick={() => setViendo(null)}>Cerrar</button></div>
        </Modal>
      )}
      <Toast>{aviso}</Toast>
      {/* Ventana de novedades y comentarios */}
      {comentando && (
  <Modal titulo={`Novedades · ${comentando.nombre}`} descripcion="Deja constancia de lo que ocurra en terreno: ausencias, retrasos, falta de materiales, etc. Se avisa al supervisor." onClose={() => setComentando(null)}>
    <IncidenciasObra obraId={comentando.id} puedeRegistrar={ESTADOS_ABIERTOS.includes(comentando.estado)} onRegistrada={mostrar} />
    <div className="adm-modal-actions"><button className="adm-btn" onClick={() => setComentando(null)}>Cerrar</button></div>
  </Modal>
)}
    </AppLayout>
  );
}

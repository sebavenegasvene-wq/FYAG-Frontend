import { useNavigate } from "react-router-dom";
import { useNotificaciones } from "../hooks/useNotificaciones";
import { usePopover } from "../hooks/usePopover";
import { RUTA_OBRAS } from "../lib/roles";
import { IconCampana } from "./icons";

// Convierte una fecha en 'hace 5 min', 'hace 2 h' o la fecha si es antigua
const hace = (iso) => {
  const min = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  return new Date(iso).toLocaleDateString("es-CL");
};

// Campana con contador de no leídas y panel con los avisos (guardados en el servidor).
// CAMPANA DE AVISOS: muestra cuántos avisos hay sin leer y un panel con la lista.
export default function NotificationBell({ rol }) {
  // Los avisos vienen del hook useNotificaciones (consulta al servidor cada 30 s)
  const { items, noLeidas, marcarLeidas, marcarLeida, revisar } = useNotificaciones();
  // usePopover controla si el panel está abierto o cerrado
  const { abierto, setAbierto, ref } = usePopover();
  const navigate = useNavigate();

  // Al abrir el panel vuelve a consultar los avisos
  const abrirPanel = () => { if (!abierto) revisar(); setAbierto((v) => !v); };
  // Al hacer clic en un aviso: lo marca como leído, cierra el panel y va a la pantalla de obras del rol
  const abrir = (n) => { marcarLeida(n.id); setAbierto(false); navigate(RUTA_OBRAS[rol] ?? "/obras"); };

  return (
    <div className="adm-pop" ref={ref}>
      <button type="button" className="adm-btn adm-btn-sm adm-icon-btn adm-bell" aria-haspopup="true" aria-expanded={abierto}
        aria-label={noLeidas ? `Notificaciones: ${noLeidas} sin leer` : "Notificaciones"} title="Notificaciones" onClick={abrirPanel}>
        <IconCampana />
        {/* Globo rojo con el número de avisos sin leer (muestra 9+ si son más) */}
        {noLeidas > 0 && <span className="adm-badge" aria-hidden="true">{noLeidas > 9 ? "9+" : noLeidas}</span>}
      </button>
      {abierto && (
        <div className="adm-pop-panel adm-notifs" role="region" aria-label="Notificaciones de obras">
          <div className="adm-notifs-head">
            <strong className="adm-pop-title">Notificaciones de obras</strong>
            <div>
              <button type="button" className="adm-link" onClick={marcarLeidas} disabled={!noLeidas}>Marcar leídas</button>
            </div>
          </div>
          {/* Si no hay avisos muestra un texto; si hay, la lista */}
          {items.length === 0 ? (
            <p className="adm-notifs-empty">Sin novedades. Te avisaremos cuando una obra cambie de estado, se te asigne o reciba una novedad.</p>
          ) : (
            <ul>
              {items.map((n) => (
                <li key={n.id}>
                  <button type="button" className={`adm-notif ${n.tono ?? "info"}${n.leida ? " leida" : ""}`} onClick={() => abrir(n)}>
                    <span className="adm-notif-dot" aria-hidden="true" />
                    <span><span className="adm-notif-text">{n.mensaje}</span><small>{hace(n.fechaCreacion)}{n.leida ? "" : " · nueva"}</small></span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
import { useNavigate } from "react-router-dom";
import { useNotificaciones } from "../hooks/useNotificaciones";
import { usePopover } from "../hooks/usePopover";
import { RUTA_OBRAS } from "../lib/roles";
import { IconCampana } from "./icons";

const hace = (iso) => {
  const min = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  return new Date(iso).toLocaleDateString("es-CL");
};

// Campana con contador de no leídas y panel con los avisos (guardados en el servidor).
export default function NotificationBell({ rol }) {
  const { items, noLeidas, marcarLeidas, marcarLeida, revisar } = useNotificaciones();
  const { abierto, setAbierto, ref } = usePopover();
  const navigate = useNavigate();

  const abrirPanel = () => { if (!abierto) revisar(); setAbierto((v) => !v); };
  const abrir = (n) => { marcarLeida(n.id); setAbierto(false); navigate(RUTA_OBRAS[rol] ?? "/obras"); };

  return (
    <div className="adm-pop" ref={ref}>
      <button type="button" className="adm-btn adm-btn-sm adm-icon-btn adm-bell" aria-haspopup="true" aria-expanded={abierto}
        aria-label={noLeidas ? `Notificaciones: ${noLeidas} sin leer` : "Notificaciones"} title="Notificaciones" onClick={abrirPanel}>
        <IconCampana />
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
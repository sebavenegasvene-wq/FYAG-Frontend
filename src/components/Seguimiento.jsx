import { useCallback, useEffect, useState } from "react";
import { getSeguimientoObra } from "../api/seguimiento";
import { mensajeError } from "../lib/errores";
import { fecha } from "../lib/format";
import { IconCerrar, IconCheck, IconPausa, IconReloj } from "./icons";

// SEGUIMIENTO: línea de tiempo tipo 'rastreo de paquete'. Icono y color de cada tipo de paso:
const ICONO = { COMPLETADO: <IconCheck />, ACTUAL: <IconReloj />, PAUSADO: <IconPausa />, ERROR: <IconCerrar />, PENDIENTE: null };
const TONO = { COMPLETADO: "ok", ACTUAL: "info", PAUSADO: "warn", ERROR: "bad", PENDIENTE: "" };

// Línea de tiempo del ciclo presupuesto > obra > factura > pago, con el paso actual destacado.
// `cargar` es una función que devuelve la promesa del seguimiento (obra o presupuesto).
// Recibe 'cargar' (función que pide los datos) y dibuja el resumen, la barra de avance y la lista de pasos
export default function Seguimiento({ cargar }) {
  const [seg, setSeg] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let activo = true;
    cargar().then((r) => activo && setSeg(r)).catch((e) => activo && setError(mensajeError(e, "No se pudo cargar el seguimiento.")));
    return () => { activo = false; };
  }, [cargar]);

  if (error) return <p className="adm-sub">{error}</p>;
  if (!seg) return <p className="adm-sub">Cargando seguimiento...</p>;

  // Cuántos pasos están completados y cuál es el paso actual
  const hechos = seg.pasos.filter((p) => p.estado === "COMPLETADO").length;
  const actual = seg.pasos.find((p) => p.estado !== "COMPLETADO" && p.estado !== "PENDIENTE");

  return (
    <section className="adm-track" aria-label="Seguimiento">
      <div className={`adm-track-now ${TONO[actual?.estado ?? "COMPLETADO"]}`}>
        <small>ESTADO ACTUAL</small>
        <strong>{seg.resumen}</strong>
        {actual?.responsable && <span>Responsable: {actual.responsable}</span>}
      </div>
      <div className="adm-track-bar" role="progressbar" aria-valuemin={0} aria-valuemax={seg.pasos.length} aria-valuenow={hechos}
        aria-label={`${hechos} de ${seg.pasos.length} pasos completados`}>
        {seg.pasos.map((p, i) => <i key={i} className={TONO[p.estado]} />)}
      </div>
      <ol className="adm-track-list">
        {seg.pasos.map((p, i) => (
          <li key={i} className={`adm-track-step ${p.estado.toLowerCase()} ${TONO[p.estado]}`} aria-current={p.estado === "ACTUAL" ? "step" : undefined}>
            <span className="adm-track-dot">{ICONO[p.estado]}</span>
            <div>
              <strong>{p.titulo}</strong>
              {p.detalle && <p>{p.detalle}</p>}
              {p.estado === "PENDIENTE" && p.responsable && <p>Responsable: {p.responsable}</p>}
            </div>
            {p.fecha && <time>{fecha(p.fecha)}</time>}
          </li>
        ))}
      </ol>
    </section>
  );
}

// Atajo para mostrar el seguimiento de una obra por su id
// Atajo: seguimiento de una obra por su id
export function SeguimientoDeObra({ obraId }) {
  const cargar = useCallback(() => getSeguimientoObra(obraId), [obraId]);
  return <Seguimiento cargar={cargar} />;
}

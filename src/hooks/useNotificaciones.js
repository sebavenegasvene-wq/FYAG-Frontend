import { useCallback, useEffect, useRef, useState } from "react";
import { getObras } from "../api/obras";
import { lista } from "../lib/datos";
import { ESTADO_OBRA } from "../lib/roles";

// Notificaciones de obras generadas en el cliente: se consulta la lista de obras que el usuario puede ver
// (el backend ya filtra por perfil: el Técnico solo recibe las suyas) y se compara con la última foto guardada.
// Detecta: obra nueva / asignada, cambio de estado, cambio de técnico y obra que deja de estar asignada.
const INTERVALO_MS = 60_000;
const MAX_ITEMS = 40;
const clave = (usuario) => `fyag.notif.${usuario ?? "anon"}`;

const leer = (usuario) => {
  try { return JSON.parse(localStorage.getItem(clave(usuario))) ?? {}; } catch { return {}; }
};
const guardar = (usuario, data) => {
  try { localStorage.setItem(clave(usuario), JSON.stringify(data)); } catch { /* sin almacenamiento */ }
};

const label = (e) => ESTADO_OBRA[e]?.label ?? e;

function detectar(previa, obras, rol) {
  const eventos = [];
  const ahora = new Date().toISOString();
  const nuevo = (texto, tono, obraId) => eventos.push({ id: `${obraId}-${ahora}-${eventos.length}`, texto, tono, obraId, fecha: ahora, leida: false });
  const actual = {};

  obras.forEach((o) => {
    const tecnico = o.tecnicoNombre ?? null;
    actual[o.id] = { n: o.nombre, e: o.estado, t: tecnico };
    const antes = previa[o.id];
    if (!antes) {
      nuevo(rol === "TECNICO" ? `Se te asignó la obra «${o.nombre}».` : `Nueva obra «${o.nombre}» (${label(o.estado)}).`, "info", o.id);
      return;
    }
    if (antes.e !== o.estado) {
      const extra = o.estado === "FINALIZADA" && (rol === "FINANZAS" || rol === "GERENCIA") ? " Lista para facturar." : "";
      nuevo(`Obra «${o.nombre}»: ${label(antes.e)} → ${label(o.estado)}.${extra}`, ESTADO_OBRA[o.estado]?.tono ?? "info", o.id);
    }
    if (rol !== "TECNICO" && antes.t !== tecnico) {
      nuevo(tecnico ? `Obra «${o.nombre}»: técnico asignado ${tecnico}.` : `Obra «${o.nombre}» quedó sin técnico.`, "warn", o.id);
    }
  });

  // Solo para el Técnico: una obra que ya no aparece en su lista fue reasignada o retirada.
  if (rol === "TECNICO") {
    Object.entries(previa).forEach(([id, antes]) => {
      if (!actual[id]) nuevo(`Ya no tienes asignada la obra «${antes.n}».`, "warn", id);
    });
  }
  return { actual, eventos };
}

export function useNotificaciones(usuario, rol) {
  const [items, setItems] = useState(() => leer(usuario).items ?? []);
  const enCurso = useRef(false);

  const revisar = useCallback(async (forzar = false) => {
    const guardado = leer(usuario);
    if (!forzar && guardado.ultimo && Date.now() - guardado.ultimo < INTERVALO_MS / 2) return; // evita repetir al cambiar de pantalla
    if (enCurso.current) return;
    enCurso.current = true;
    try {
      const obras = lista(await getObras({ size: 100 }));
      const { actual, eventos } = detectar(guardado.snap ?? {}, obras, rol);
      const primera = !guardado.snap; // la primera vez solo se toma la foto, sin avisar de todo lo existente
      const nuevos = primera ? [] : [...eventos.reverse(), ...(guardado.items ?? [])].slice(0, MAX_ITEMS);
      const resultado = primera ? (guardado.items ?? []) : nuevos;
      guardar(usuario, { snap: actual, items: resultado, ultimo: Date.now() });
      setItems(resultado);
    } catch { /* sin conexión o sin permiso: se reintenta en el próximo ciclo */ }
    finally { enCurso.current = false; }
  }, [usuario, rol]);

  useEffect(() => {
    revisar();
    const t = setInterval(() => revisar(true), INTERVALO_MS);
    const visible = () => { if (document.visibilityState === "visible") revisar(); };
    document.addEventListener("visibilitychange", visible);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", visible); };
  }, [revisar]);

  const actualizar = (fn) => setItems((prev) => {
    const nuevo = fn(prev);
    guardar(usuario, { ...leer(usuario), items: nuevo });
    return nuevo;
  });
  const marcarLeidas = () => actualizar((prev) => prev.map((n) => ({ ...n, leida: true })));
  const marcarLeida = (id) => actualizar((prev) => prev.map((n) => (n.id === id ? { ...n, leida: true } : n)));
  const limpiar = () => actualizar(() => []);

  return { items, noLeidas: items.filter((n) => !n.leida).length, marcarLeidas, marcarLeida, limpiar, revisar: () => revisar(true) };
}

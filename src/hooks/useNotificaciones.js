// HOOK useNotificaciones: trae los avisos de la campana y los mantiene actualizados.
import { useCallback, useEffect, useRef, useState } from "react";
import { getNotificaciones, marcarNotificacionLeida, marcarTodasLeidas } from "../api/notificaciones";

// Los avisos viven en el servidor: el mismo usuario los ve igual desde el computador o el celular.
// El hook solo consulta cada cierto tiempo y cuando la pestaña vuelve a estar visible.
const INTERVALO_MS = 30_000;

export function useNotificaciones() {
  // Lista de avisos
  const [items, setItems] = useState([]);
  // Cantidad de avisos sin leer
  const [noLeidas, setNoLeidas] = useState(0);
  // Evita hacer dos consultas al mismo tiempo
  const enCurso = useRef(false);

  // Consulta los avisos al servidor
  const revisar = useCallback(async () => {
    if (enCurso.current) return;
    enCurso.current = true;
    try {
      const r = await getNotificaciones();
      setItems(r.items ?? []);
      setNoLeidas(r.noLeidas ?? 0);
    } catch { /* sin conexión o sesión vencida: se reintenta en el próximo ciclo */ }
    finally { enCurso.current = false; }
  }, []);

  useEffect(() => {
    revisar();
    // Consulta cada 30 segundos y también cuando el usuario vuelve a la pestaña
    const t = setInterval(() => { if (document.visibilityState === "visible") revisar(); }, INTERVALO_MS);
    const visible = () => { if (document.visibilityState === "visible") revisar(); };
    document.addEventListener("visibilitychange", visible);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", visible); };
  }, [revisar]);

  // Marca un aviso como leído (se actualiza la pantalla al tiro y luego se avisa al servidor)
  const marcarLeida = async (id) => {
    const n = items.find((x) => x.id === id);
    if (!n || n.leida) return;
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, leida: true } : x)));
    setNoLeidas((c) => Math.max(0, c - 1));
    try { await marcarNotificacionLeida(id); } catch { revisar(); }
  };

  // Marca todos como leídos
  const marcarLeidas = async () => {
    setItems((prev) => prev.map((x) => ({ ...x, leida: true })));
    setNoLeidas(0);
    try { await marcarTodasLeidas(); } catch { revisar(); }
  };

  // Lo que el componente de la campana puede usar
  return { items, noLeidas, marcarLeida, marcarLeidas, revisar };
}
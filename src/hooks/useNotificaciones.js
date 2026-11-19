import { useCallback, useEffect, useRef, useState } from "react";
import { getNotificaciones, marcarNotificacionLeida, marcarTodasLeidas } from "../api/notificaciones";

// Los avisos viven en el servidor: el mismo usuario los ve igual desde el computador o el celular.
// El hook solo consulta cada cierto tiempo y cuando la pestaña vuelve a estar visible.
const INTERVALO_MS = 30_000;

export function useNotificaciones() {
  const [items, setItems] = useState([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const enCurso = useRef(false);

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
    const t = setInterval(() => { if (document.visibilityState === "visible") revisar(); }, INTERVALO_MS);
    const visible = () => { if (document.visibilityState === "visible") revisar(); };
    document.addEventListener("visibilitychange", visible);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", visible); };
  }, [revisar]);

  const marcarLeida = async (id) => {
    const n = items.find((x) => x.id === id);
    if (!n || n.leida) return;
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, leida: true } : x)));
    setNoLeidas((c) => Math.max(0, c - 1));
    try { await marcarNotificacionLeida(id); } catch { revisar(); }
  };

  const marcarLeidas = async () => {
    setItems((prev) => prev.map((x) => ({ ...x, leida: true })));
    setNoLeidas(0);
    try { await marcarTodasLeidas(); } catch { revisar(); }
  };

  return { items, noLeidas, marcarLeida, marcarLeidas, revisar };
}
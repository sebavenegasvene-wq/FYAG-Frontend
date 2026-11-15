import { useCallback, useEffect, useState } from "react";

// Aviso breve (se oculta solo). Uso: const { aviso, mostrar } = useToast();
export function useToast(ms = 3500) {
  const [aviso, setAviso] = useState(null);
  useEffect(() => {
    if (!aviso) return undefined;
    const t = setTimeout(() => setAviso(null), ms);
    return () => clearTimeout(t);
  }, [aviso, ms]);
  const mostrar = useCallback((texto) => setAviso(texto), []);
  return { aviso, mostrar };
}

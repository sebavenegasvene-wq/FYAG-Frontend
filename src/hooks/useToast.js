// HOOK useToast: muestra un aviso corto de confirmación o error que desaparece solo.
import { useCallback, useEffect, useState } from "react";

// Aviso breve (se oculta solo). Uso: const { aviso, mostrar } = useToast();
export function useToast(ms = 3500) {
  const [aviso, setAviso] = useState(null);
  useEffect(() => {
    if (!aviso) return undefined;
    // Oculta el aviso después de unos segundos
    const t = setTimeout(() => setAviso(null), ms);
    return () => clearTimeout(t);
  }, [aviso, ms]);
  // Función que se llama para mostrar un aviso
  const mostrar = useCallback((texto) => setAviso(texto), []);
  return { aviso, mostrar };
}

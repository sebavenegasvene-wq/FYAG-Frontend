import { useEffect, useRef, useState } from "react";

// Panel desplegable: se cierra con Escape o al hacer clic/tocar fuera. Uso: const { abierto, setAbierto, ref } = usePopover();
export function usePopover() {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!abierto) return undefined;
    const fuera = (e) => { if (ref.current && !ref.current.contains(e.target)) setAbierto(false); };
    const tecla = (e) => { if (e.key === "Escape") setAbierto(false); };
    document.addEventListener("pointerdown", fuera);
    document.addEventListener("keydown", tecla);
    return () => { document.removeEventListener("pointerdown", fuera); document.removeEventListener("keydown", tecla); };
  }, [abierto]);
  return { abierto, setAbierto, ref };
}

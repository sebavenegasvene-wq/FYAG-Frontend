import { useEffect } from "react";

const EVENTOS = ["mousemove", "keydown", "click", "touchstart", "scroll"];

// Cierra la sesión tras N minutos sin actividad (RNF-01: bloqueo de sesiones inactivas).
export function useInactividad(onTimeout, minutos = 30) {
  useEffect(() => {
    let timer;
    const reiniciar = () => {
      clearTimeout(timer);
      timer = setTimeout(onTimeout, minutos * 60 * 1000);
    };
    EVENTOS.forEach((e) => window.addEventListener(e, reiniciar, { passive: true }));
    reiniciar();
    return () => {
      clearTimeout(timer);
      EVENTOS.forEach((e) => window.removeEventListener(e, reiniciar));
    };
  }, [onTimeout, minutos]);
}

// HOOK useInactividad: cierra la sesión si el usuario no hace nada durante varios minutos.
import { useEffect } from "react";

// Acciones que cuentan como 'actividad' del usuario
const EVENTOS = ["mousemove", "keydown", "click", "touchstart", "scroll"];

// Cierra la sesión tras N minutos sin actividad (RNF-01: bloqueo de sesiones inactivas).
export function useInactividad(onTimeout, minutos = 30) {
  useEffect(() => {
    let timer;
    const reiniciar = () => {
      clearTimeout(timer);
      timer = setTimeout(onTimeout, minutos * 60 * 1000);
    };
    // Cada vez que hay actividad, se reinicia el reloj
    EVENTOS.forEach((e) => window.addEventListener(e, reiniciar, { passive: true }));
    // Inicia el reloj al cargar la pantalla
    reiniciar();
    // Al salir de la pantalla se limpian el reloj y los eventos
    return () => {
      clearTimeout(timer);
      EVENTOS.forEach((e) => window.removeEventListener(e, reiniciar));
    };
  }, [onTimeout, minutos]);
}

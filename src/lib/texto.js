// Tamaño y grosor de letra. El nivel 0 es el tamaño original de la página (mínimo); no se puede bajar de ahí.
// Nombre con el que se guarda la preferencia de letra en el navegador
const CLAVE = "fyag.texto";
// Multiplicadores de tamaño de letra: 1 = normal, 1.5 = 50% más grande
export const ESCALAS = [1, 1.1, 1.2, 1.35, 1.5];
// Último nivel permitido
export const NIVEL_MAX = ESCALAS.length - 1;

// Lee el tamaño y grosor de letra guardados
export function leerTexto() {
  try {
    const t = JSON.parse(localStorage.getItem(CLAVE) ?? "{}");
    const nivel = Number.isInteger(t.nivel) ? Math.min(Math.max(t.nivel, 0), NIVEL_MAX) : 0;
    return { nivel, negrita: t.negrita === true };
  } catch {
    return { nivel: 0, negrita: false };
  }
}

// Aplica el tamaño con la variable CSS --fs, que usan todos los estilos; y activa la negrita si corresponde
export function aplicarTexto({ nivel, negrita }) {
  const el = document.documentElement;
  el.style.setProperty("--fs", String(ESCALAS[nivel] ?? 1));
  if (negrita) el.dataset.negrita = "1";
  else delete el.dataset.negrita;
}

// Guarda la preferencia y la aplica
export function guardarTexto(texto) {
  try { localStorage.setItem(CLAVE, JSON.stringify(texto)); } catch { /* almacenamiento no disponible */ }
  aplicarTexto(texto);
}

// Se llama una vez al iniciar la app
export const initTexto = () => aplicarTexto(leerTexto());
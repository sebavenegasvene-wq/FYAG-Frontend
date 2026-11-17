// Tamaño y grosor de letra. El nivel 0 es el tamaño original de la página (mínimo); no se puede bajar de ahí.
const CLAVE = "fyag.texto";
export const ESCALAS = [1, 1.1, 1.2, 1.35, 1.5];
export const NIVEL_MAX = ESCALAS.length - 1;

export function leerTexto() {
  try {
    const t = JSON.parse(localStorage.getItem(CLAVE) ?? "{}");
    const nivel = Number.isInteger(t.nivel) ? Math.min(Math.max(t.nivel, 0), NIVEL_MAX) : 0;
    return { nivel, negrita: t.negrita === true };
  } catch {
    return { nivel: 0, negrita: false };
  }
}

export function aplicarTexto({ nivel, negrita }) {
  const el = document.documentElement;
  el.style.setProperty("--fs", String(ESCALAS[nivel] ?? 1));
  if (negrita) el.dataset.negrita = "1";
  else delete el.dataset.negrita;
}

export function guardarTexto(texto) {
  try { localStorage.setItem(CLAVE, JSON.stringify(texto)); } catch { /* almacenamiento no disponible */ }
  aplicarTexto(texto);
}

export const initTexto = () => aplicarTexto(leerTexto());
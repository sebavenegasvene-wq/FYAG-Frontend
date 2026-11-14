// Tema de la interfaz: paleta de color + modo claro/oscuro. Se guarda por dispositivo en localStorage.
const CLAVE = "fyag.tema";

// Cada paleta define el color de acento; los colores de estado (verde/rojo/ámbar/azul) no cambian (HU-17).
export const PALETAS = [
  { id: "slate", nombre: "Gris (predeterminada)", muestra: ["#a0a0a0", "#3f4756"] },
  { id: "oceano", nombre: "Océano", muestra: ["#38bdf8", "#0369a1"] },
  { id: "turquesa", nombre: "Turquesa", muestra: ["#2dd4bf", "#0f766e"] },
  { id: "violeta", nombre: "Violeta", muestra: ["#c4b5fd", "#6d28d9"] },
  { id: "rosa", nombre: "Rosa", muestra: ["#f9a8d4", "#be185d"] },
  { id: "naranja", nombre: "Naranja", muestra: ["#fb923c", "#c2410c"] },
  { id: "contraste", nombre: "Alto contraste", muestra: ["#ffe600", "#000000"] },
];

const POR_DEFECTO = { paleta: "slate", modo: "dark" };

export function leerTema() {
  try {
    const t = JSON.parse(localStorage.getItem(CLAVE) ?? "{}");
    return {
      paleta: PALETAS.some((p) => p.id === t.paleta) ? t.paleta : POR_DEFECTO.paleta,
      modo: t.modo === "light" ? "light" : "dark",
    };
  } catch {
    return { ...POR_DEFECTO };
  }
}

export function aplicarTema({ paleta, modo }) {
  const el = document.documentElement;
  el.dataset.paleta = paleta;
  el.dataset.modo = modo;
  // Color de la barra del navegador en el celular
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", getComputedStyle(el).getPropertyValue("--bg").trim() || "#121212");
}

export function guardarTema(tema) {
  try { localStorage.setItem(CLAVE, JSON.stringify(tema)); } catch { /* almacenamiento no disponible */ }
  aplicarTema(tema);
}

export const initTema = () => aplicarTema(leerTema());

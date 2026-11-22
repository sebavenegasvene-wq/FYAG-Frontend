// BOTÓN DE AYUDA (?): al pulsarlo muestra un panel con el tutorial de la pantalla y un mensaje sobre cada botón explicando qué hace.
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { getRole } from "../api/auth";
import { ayudaPara } from "../lib/ayuda";
import { corto, describir } from "../lib/ayudaBotones";
import { IconAyuda, IconCandado, IconCerrar, IconLista, IconOjo, IconOjoNo, IconPuntero, IconReloj } from "./icons";

// Deja un texto en minúsculas y sin símbolos para poder compararlo
const norm = (s) => (s ?? "").toLocaleLowerCase("es").replace(/[^\p{L}\p{N} ]/gu, " ").replace(/\s+/g, " ").trim();
// Elementos propios de la ayuda: se ignoran al buscar botones
const FUERA = ".adm-help, .adm-help-btn, .adm-tour";

// Busca en pantalla el botón o campo al que apunta un paso: por su texto, aria-label o placeholder.
// Si hay un modal abierto, solo busca dentro de él.
// Busca en la pantalla el botón o campo que nombra un paso de la ayuda
function buscar(ir) {
  const objetivo = norm(ir);
  if (!objetivo) return null;
  const raiz = document.querySelector("[role='dialog'][aria-modal='true']") ?? document.querySelector("main");
  if (!raiz) return null;
  const candidatos = [...raiz.querySelectorAll("button, a, select, input, textarea, [role='tab'], [aria-label]")]
    .filter((el) => !el.closest(FUERA) && el.getClientRects().length > 0)
    .map((el) => {
      const interactivo = /^(BUTTON|A)$/.test(el.tagName) || el.getAttribute("role") === "tab";
      return { el, etiqueta: norm(el.getAttribute("aria-label") || el.getAttribute("placeholder") || (interactivo ? el.textContent : "")) };
    })
    .filter((c) => c.etiqueta);
  return (candidatos.find((c) => c.etiqueta === objetivo) ?? candidatos.find((c) => c.etiqueta.includes(objetivo)))?.el ?? null;
}

// Separación entre un mensaje y su botón, y ancho máximo del mensaje
const HUECO = 9; // separación entre el mensaje y su botón
const ANCHO_MAX = 220;

// Todos los botones, enlaces y campos visibles que tienen un mensaje de ayuda (uno por tipo de botón).
// Si hay un modal abierto, solo se consideran los de dentro del modal.
// Junta los botones visibles que tienen mensaje (uno por tipo de botón). El menú y la barra de herramientas se agrupan en un solo mensaje cada uno
function recolectar() {
  const raiz = document.querySelector("[role='dialog'][aria-modal='true']") ?? document.body;
  const vistos = new Set();
  const salida = [];
  const todos = []; // todo lo que un mensaje no debe tapar
  const grupos = new Map(); // menú y barra de herramientas: cada uno se explica en un solo mensaje
  document.querySelectorAll(".adm-help, .adm-help-btn").forEach((el) => todos.push({ el: null, r: el.getBoundingClientRect() }));
  raiz.querySelectorAll("a[href], button, [role='tab'], select, input:not([type='hidden']), textarea").forEach((el) => {
    if (el.closest(FUERA) || el.getClientRects().length === 0) return;
    const r = el.getBoundingClientRect();
    if (r.width < 8 || r.height < 8 || r.bottom < 0 || r.top > window.innerHeight || r.right < 0 || r.left > window.innerWidth) return;
    todos.push({ el, r });
    if (el.classList.contains("adm-logo")) return; // ya lo explica "Inicio"
    const etq = el.getAttribute("aria-label") || el.textContent;
    const contenedor = el.closest(".adm-nav, .adm-user");
    if (contenedor) {
      const c = corto(etq);
      if (c) grupos.set(contenedor, [...(grupos.get(contenedor) ?? []), { el, r, ...c }]);
      return;
    }
    let clave;
    let texto;
    let rotulo;
    if (el.classList.contains("adm-module")) {
      const titulo = el.querySelector("strong")?.textContent?.trim();
      if (!titulo) return;
      clave = `modulo:${titulo}`;
      texto = `Pulsa esta tarjeta para entrar a «${titulo}».`;
      rotulo = titulo;
    } else {
      const interactivo = /^(BUTTON|A)$/.test(el.tagName) || el.getAttribute("role") === "tab";
      const etiqueta = el.getAttribute("aria-label") || el.getAttribute("placeholder") || (interactivo ? el.textContent : "");
      texto = describir(etiqueta);
      if (!texto) return;
      clave = norm(etiqueta);
      rotulo = etiqueta.replace(/[＋←→+]/g, "").replace(/\s+/g, " ").trim().slice(0, 32);
    }
    if (vistos.has(clave)) return;
    vistos.add(clave);
    salida.push({ id: clave, el, r, texto, titulo: rotulo });
  });
  grupos.forEach((filas, contenedor) => {
    const izq = Math.min(...filas.map((h) => h.r.left));
    const der = Math.max(...filas.map((h) => h.r.right));
    const arr = Math.min(...filas.map((h) => h.r.top));
    const aba = Math.max(...filas.map((h) => h.r.bottom));
    const esMenu = contenedor.classList.contains("adm-nav");
    salida.push({ id: esMenu ? "menu" : "herramientas", el: filas[0].el, els: filas.map((h) => h.el), r: { left: izq, right: der, top: arr, bottom: aba, width: der - izq, height: aba - arr }, titulo: esMenu ? "Menú principal" : "Barra de herramientas", texto: "", filas });
  });
  return { items: salida.sort((a, b) => a.r.top - b.r.top || a.r.left - b.r.left), todos };
}

// Mide el tamaño real que tendrá cada mensaje (se dibuja fuera de pantalla con los mismos estilos).
// Mide el tamaño real de cada mensaje dibujándolo fuera de pantalla, para poder ubicarlos sin que se solapen
function dimensionar(items) {
  const caja = document.createElement("div");
  caja.className = "adm-tip-medida";
  const nodos = items.map((it) => {
    const b = document.createElement("span");
    b.className = "adm-tip-b";
    b.style.maxWidth = `${ANCHO_MAX}px`;
    const t = document.createElement("strong");
    t.textContent = it.titulo;
    b.append(t);
    if (it.filas) it.filas.forEach((f) => { const d = document.createElement("span"); d.className = "adm-tip-fila"; const n = document.createElement("b"); n.textContent = f.t; d.append(n, ` ${f.d}`); b.appendChild(d); });
    else b.append(it.texto);
    caja.appendChild(b);
    return b;
  });
  document.body.appendChild(caja);
  const medidas = nodos.map((n) => ({ w: Math.ceil(n.getBoundingClientRect().width), h: Math.ceil(n.getBoundingClientRect().height) }));
  caja.remove();
  return medidas;
}

// Dice si dos rectángulos se tocan
const cruza = (a, b, m = 0) => a.x < b.x + b.w + m && b.x < a.x + a.w + m && a.y < b.y + b.h + m && b.y < a.y + a.h + m;
const caja_ = (r) => ({ x: r.left, y: r.top, w: r.width, h: r.height });

// Decide dónde va cada mensaje. Reglas: nunca encima de otro mensaje ni de otro botón pequeño.
// Prueba primero sobre el botón y luego debajo; si no cabe, corre el mensaje a los lados y, si aún no, lo aleja un nivel.
// Los mensajes son una capa flotante (position: fixed), así que no mueven nada de la interfaz.
// Decide dónde va cada mensaje: encima o debajo del botón, sin chocar con otros mensajes ni botones. Es una capa flotante, así que no mueve la interfaz
function colocar(items, todos, vw, vh) {
  const medidas = dimensionar(items);
  const puestos = []; // mensajes ya colocados
  // Los mensajes de una misma fila de botones se alinean en bandas de igual alto: queda un orden parejo
  const banda = {};
  items.forEach((it, k) => { const f = Math.round(it.r.top / 12); banda[f] = Math.max(banda[f] ?? 0, medidas[k].h); });
  return items.map((it, k) => {
    const { w, h } = medidas[k];
    const paso = banda[Math.round(it.r.top / 12)] + 6;
    const { r } = it;
    const cx = r.left + r.width / 2;
    // Los botones pequeños no se tapan; las tarjetas grandes sí pueden quedar parcialmente cubiertas
    const otros = todos.filter((o) => !(it.els ?? [it.el]).includes(o.el) && (o.el === null || o.r.height <= 80)).map((o) => caja_(o.r));
    const x0 = Math.min(Math.max(cx - w / 2, 6), vw - w - 6);
    const desvios = [0];
    for (let d = 24; d <= w / 2; d += 24) desvios.push(-d, d);

    let mejor = null;
    for (let n = 0; n < 8; n++) {
      for (const lado of ["arriba", "abajo"]) {
        const y = lado === "arriba" ? r.top - HUECO - h - n * paso : r.bottom + HUECO + n * paso;
        if (y < 4 || y + h > vh - 4) continue;
        const linea = n > 0 ? (lado === "arriba" ? { x: cx - 1, y: y + h, w: 2, h: r.top - (y + h) } : { x: cx - 1, y: r.bottom, w: 2, h: y - r.bottom }) : null;
        for (const d of desvios) {
          const x = Math.min(Math.max(x0 + d, 6), vw - w - 6);
          if (cx < x + 8 || cx > x + w - 8) continue;
          const c = { x, y, w, h };
          const choques = puestos.filter((o) => cruza(c, o, 4)).length * 10 + otros.filter((o) => cruza(c, o, 2)).length;
          if (choques === 0) { mejor = { c, lado, n, linea, choques }; break; }
          if (!mejor || choques < mejor.choques) mejor = { c, lado, n, linea, choques };
        }
        if (mejor?.choques === 0) break;
      }
      if (mejor?.choques === 0) break;
    }
    if (!mejor) mejor = { c: { x: x0, y: Math.min(r.bottom + HUECO, vh - h - 4), w, h }, lado: "abajo", n: 0, linea: null };
    puestos.push(mejor.c);
    const { c } = mejor;
    const ax = Math.min(Math.max(cx - c.x, 14), w - 14);
    const lx = Math.min(Math.max(c.x + ax, r.left + 2), r.right - 2);
    const linea = mejor.linea ? { top: mejor.linea.y, h: mejor.linea.h } : null;
    return { id: it.id, el: it.el, texto: it.texto, titulo: it.titulo, filas: it.filas, ...c, lado: mejor.lado, ax, lx, linea };
  });
}

// Botón de ayuda visible en cada pantalla: abre un minitutorial según el rol, sin sacar al usuario de la vista (HU-28).
// Mientras está abierto muestra, encima de cada botón, un mensaje corto que explica qué hace.
// Componente principal del botón de ayuda
export default function HelpButton() {
  // Ruta actual (cada pantalla tiene su propia ayuda)
  const { pathname } = useLocation();
  // Estados: si el panel está abierto, si se ven los mensajes, paso resaltado, mensajes calculados, etc.
  const [abierto, setAbierto] = useState(false);
  const [marcas, setMarcas] = useState(true);
  const [activo, setActivo] = useState(null); // paso resaltado
  const [capa, setCapa] = useState(null); // null | "in" | "out": capa de mensajes (la salida se anima antes de quitarla)
  const [burbujas, setBurbujas] = useState([]); // mensajes sobre cada botón
  const [marcados, setMarcados] = useState(() => new Set()); // pasos que están señalados en pantalla
  const [anillo, setAnillo] = useState(null); // rectángulo del paso resaltado
  const panel = useRef(null);
  // Contenido de ayuda de esta pantalla para el rol del usuario (viene de lib/ayuda.js)
  const ayuda = ayudaPara(pathname, getRole());
  const pasos = (ayuda?.pasos ?? []).map((p) => (typeof p === "string" ? { texto: p } : p));

  // Recalcula dónde van los mensajes y qué paso está señalado
  const medir = useCallback(() => {
    const activoEl = activo != null && pasos[activo]?.ir ? buscar(pasos[activo].ir) : null;
    const marcas_ = new Set();
    let rect = null;
    pasos.forEach((p, i) => {
      const el = p.ir ? buscar(p.ir) : null;
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight || r.right < 0 || r.left > window.innerWidth) return;
      marcas_.add(i);
      if (i === activo) rect = { x: r.left - 4, y: r.top - 4, w: r.width + 8, h: r.height + 8 };
    });
    const { items, todos } = recolectar();
    setBurbujas(colocar(items, todos, window.innerWidth, window.innerHeight).map((b) => ({ ...b, activa: b.el === activoEl })));
    setMarcados(marcas_);
    setAnillo(rect);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, activo]);

  // La capa entra al abrir y sale con animación al cerrar
  useEffect(() => {
    if (abierto) { setCapa("in"); return undefined; }
    setCapa((c) => (c ? "out" : c));
    const t = setTimeout(() => setCapa(null), 220);
    return () => clearTimeout(t);
  }, [abierto]);

  // Recalcula al abrir, al hacer scroll o cambiar el tamaño, y cada medio segundo por si la pantalla cambió (modales, datos cargados)
  // Mientras la ayuda está abierta, vuelve a calcular al hacer scroll, cambiar el tamaño de la ventana y cada medio segundo
  const viva = capa !== null && marcas;
  useEffect(() => {
    if (!viva) { setBurbujas([]); setAnillo(null); return undefined; }
    medir();
    const t = setInterval(medir, 500);
    window.addEventListener("scroll", medir, true);
    window.addEventListener("resize", medir);
    return () => { clearInterval(t); window.removeEventListener("scroll", medir, true); window.removeEventListener("resize", medir); };
  }, [viva, medir]);

  useEffect(() => {
    if (!abierto) return undefined;
    const onKey = (e) => e.key === "Escape" && setAbierto(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [abierto]);

  // Si la pantalla no tiene ayuda, no se muestra el botón
  if (!ayuda) return null;

  // Al tocar un paso: lo resalta y hace scroll hasta el botón al que apunta
  const elegir = (i) => {
    setActivo(i);
    const el = pasos[i]?.ir ? buscar(pasos[i].ir) : null;
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
    panel.current?.querySelector(`[data-paso="${i}"]`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  };

  return (
    <>
      {capa && marcas && (
        <div className={`adm-tour${capa === "out" ? " salida" : ""}`} aria-hidden="true">
          {anillo && <i className="adm-tour-ring" style={{ left: anillo.x, top: anillo.y, width: anillo.w, height: anillo.h }} />}
          {burbujas.map((b, i) => b.linea && (
            <i key={`l-${b.id}`} className="adm-tip-line" style={{ left: b.lx - 1, top: b.linea.top, height: Math.max(0, b.linea.h), "--d": `${Math.min(i, 14) * 40}ms` }} />
          ))}
          {burbujas.map((b, i) => (
            <div key={b.id} className={`adm-tip ${b.lado}${b.activa ? " activa" : ""}`}
              style={{ left: b.x, width: b.w, ...(b.lado === "arriba" ? { bottom: window.innerHeight - (b.y + b.h) } : { top: b.y }), "--ax": `${b.ax}px`, "--d": `${Math.min(i, 14) * 40}ms` }}>
              <span className="adm-tip-b"><strong>{b.titulo}</strong>
                {b.filas ? b.filas.map((f) => <span key={f.t} className="adm-tip-fila"><b>{f.t}</b> {f.d}</span>) : b.texto}</span>
            </div>
          ))}
        </div>
      )}
      {/* Panel con el título, el texto y los pasos de la ayuda */}
      {abierto && (
        <aside ref={panel} className="adm-help" role="dialog" aria-label={`Ayuda: ${ayuda.titulo}`}>
          <button className="adm-help-close" aria-label="Cerrar ayuda" onClick={() => setAbierto(false)}><IconCerrar /></button>
          <h2 className="adm-help-title"><IconAyuda /> {ayuda.titulo}</h2>
          <p>{ayuda.texto}</p>
          {pasos.length > 0 && <>
            <h3 className="adm-help-h"><IconLista /> Cómo se usa</h3>
            <ol className="adm-help-steps">
              {pasos.map((p, i) => (
                <li key={i} data-paso={i} className={i === activo ? "activo" : undefined}>
                  <button type="button" onClick={() => elegir(i)} aria-label={`Paso ${i + 1}: ${p.texto}`}>
                    <span className="adm-help-num">{i + 1}</span>
                    <span>{p.texto}</span>
                    {marcados.has(i) && <span className="adm-help-pin" title="Está señalado en pantalla"><IconPuntero /></span>}
                  </button>
                </li>
              ))}
            </ol>
            {pasos.some((p) => p.ir) && (
              <button type="button" className="adm-btn adm-btn-sm adm-help-toggle" aria-pressed={marcas} onClick={() => setMarcas((v) => !v)}>
                {marcas ? <><IconOjoNo /> Ocultar mensajes en pantalla</> : <><IconOjo /> Mostrar mensajes en pantalla</>}
              </button>
            )}
          </>}
          {ayuda.limites?.length > 0 && (
            <div className="adm-help-box limites">
              <h3><IconCandado /> Lo que no puedes hacer</h3>
              <ul>{ayuda.limites.map((l) => <li key={l}>{l}</li>)}</ul>
            </div>
          )}
          {ayuda.depende?.length > 0 && (
            <div className="adm-help-box depende">
              <h3><IconReloj /> Depende de otros</h3>
              <ul>{ayuda.depende.map((d) => <li key={d}>{d}</li>)}</ul>
            </div>
          )}
        </aside>
      )}
      <button className="adm-help-btn" aria-label="Ayuda de esta pantalla" aria-expanded={abierto} onClick={() => { setActivo(null); setAbierto((v) => !v); }}>
        {abierto ? <IconCerrar /> : <IconAyuda />}
      </button>
    </>
  );
}
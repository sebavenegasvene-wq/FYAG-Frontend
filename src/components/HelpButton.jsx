import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { getRole } from "../api/auth";
import { ayudaPara } from "../lib/ayuda";
import { IconAyuda, IconCandado, IconCerrar, IconLista, IconOjo, IconOjoNo, IconPuntero, IconReloj } from "./icons";

const norm = (s) => (s ?? "").toLocaleLowerCase("es").replace(/[^\p{L}\p{N} ]/gu, " ").replace(/\s+/g, " ").trim();
const FUERA = ".adm-help, .adm-help-btn, .adm-tour";

// Busca en pantalla el botón o campo al que apunta un paso: por su texto, aria-label o placeholder.
// Si hay un modal abierto, solo busca dentro de él.
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

// Botón de ayuda visible en cada pantalla: abre un minitutorial según el rol, sin sacar al usuario de la vista (HU-28).
// Mientras está abierto pone un número en pantalla junto a cada botón que explica un paso.
export default function HelpButton() {
  const { pathname } = useLocation();
  const [abierto, setAbierto] = useState(false);
  const [marcas, setMarcas] = useState(true);
  const [activo, setActivo] = useState(null); // paso resaltado
  const [puntos, setPuntos] = useState([]); // [{ i, x, y }] posición de cada número
  const [anillo, setAnillo] = useState(null); // rectángulo del paso resaltado
  const panel = useRef(null);
  const ayuda = ayudaPara(pathname, getRole());
  const pasos = (ayuda?.pasos ?? []).map((p) => (typeof p === "string" ? { texto: p } : p));

  const medir = useCallback(() => {
    const nuevos = [];
    let rect = null;
    pasos.forEach((p, i) => {
      const el = p.ir ? buscar(p.ir) : null;
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight || r.right < 0 || r.left > window.innerWidth) return;
      // Si otro número ya ocupa ese lugar (mismo botón o botones pegados), se corre a la derecha hasta quedar libre
      let x = Math.max(4, r.left - 10);
      const y = Math.max(4, r.top - 10);
      while (nuevos.some((m) => Math.abs(m.x - x) < 26 && Math.abs(m.y - y) < 26)) x += 26;
      nuevos.push({ i, x, y });
      if (i === activo) rect = { x: r.left - 4, y: r.top - 4, w: r.width + 8, h: r.height + 8 };
    });
    setPuntos(nuevos);
    setAnillo(rect);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, activo]);

  // Recalcula al abrir, al hacer scroll o cambiar el tamaño, y cada medio segundo por si la pantalla cambió (modales, datos cargados)
  useEffect(() => {
    if (!abierto || !marcas) { setPuntos([]); setAnillo(null); return undefined; }
    medir();
    const t = setInterval(medir, 500);
    window.addEventListener("scroll", medir, true);
    window.addEventListener("resize", medir);
    return () => { clearInterval(t); window.removeEventListener("scroll", medir, true); window.removeEventListener("resize", medir); };
  }, [abierto, marcas, medir]);

  useEffect(() => {
    if (!abierto) return undefined;
    const onKey = (e) => e.key === "Escape" && setAbierto(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [abierto]);

  if (!ayuda) return null;

  const elegir = (i) => {
    setActivo(i);
    const el = pasos[i]?.ir ? buscar(pasos[i].ir) : null;
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
    panel.current?.querySelector(`[data-paso="${i}"]`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  };
  const conMarca = new Set(puntos.map((m) => m.i));

  return (
    <>
      {abierto && marcas && (
        <div className="adm-tour" aria-hidden="true">
          {anillo && <i className="adm-tour-ring" style={{ left: anillo.x, top: anillo.y, width: anillo.w, height: anillo.h }} />}
          {puntos.map((m) => (
            <button key={m.i} type="button" tabIndex={-1} className={`adm-tour-dot${m.i === activo ? " activo" : ""}`}
              style={{ left: m.x, top: m.y }} onClick={() => elegir(m.i)}>{m.i + 1}</button>
          ))}
        </div>
      )}
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
                    {conMarca.has(i) && <span className="adm-help-pin" title="Está señalado en pantalla"><IconPuntero /></span>}
                  </button>
                </li>
              ))}
            </ol>
            {pasos.some((p) => p.ir) && (
              <button type="button" className="adm-btn adm-btn-sm adm-help-toggle" aria-pressed={marcas} onClick={() => setMarcas((v) => !v)}>
                {marcas ? <><IconOjoNo /> Ocultar números en pantalla</> : <><IconOjo /> Mostrar números en pantalla</>}
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
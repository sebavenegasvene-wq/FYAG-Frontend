import { useState } from "react";
import { usePopover } from "../hooks/usePopover";
import { guardarTema, leerTema, PALETAS } from "../lib/tema";
import { IconLuna, IconPaleta, IconSol } from "./icons";

// Dos botones: selector de paleta de color y alternador modo claro / oscuro.
export default function ThemeControls() {
  const [tema, setTema] = useState(leerTema);
  const { abierto, setAbierto, ref } = usePopover();

  const cambiar = (parcial) => {
    const nuevo = { ...tema, ...parcial };
    setTema(nuevo);
    guardarTema(nuevo);
  };
  const oscuro = tema.modo === "dark";

  return (
    <div className="adm-theme">
      <div className="adm-pop" ref={ref}>
        <button type="button" className="adm-btn adm-btn-sm adm-icon-btn" aria-label="Cambiar paleta de colores" aria-haspopup="true" aria-expanded={abierto} title="Paleta de colores" onClick={() => setAbierto((v) => !v)}>
          <IconPaleta />
        </button>
        {abierto && (
          <div className="adm-pop-panel adm-palettes" role="group" aria-label="Paleta de colores">
            <strong className="adm-pop-title">Paleta de colores</strong>
            {PALETAS.map((p) => (
              <button key={p.id} type="button" className="adm-palette" aria-pressed={tema.paleta === p.id} onClick={() => cambiar({ paleta: p.id })}>
                <span className="adm-swatch" aria-hidden="true"><i style={{ background: p.muestra[0] }} /><i style={{ background: p.muestra[1] }} /></span>
                <span>{p.nombre}</span>
                {tema.paleta === p.id && <b aria-hidden="true">✓</b>}
              </button>
            ))}
          </div>
        )}
      </div>
      <button type="button" className="adm-btn adm-btn-sm adm-icon-btn" aria-pressed={!oscuro} aria-label={oscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro"} title={oscuro ? "Modo claro" : "Modo oscuro"} onClick={() => cambiar({ modo: oscuro ? "light" : "dark" })}>
        {oscuro ? <IconSol /> : <IconLuna />}
      </button>
    </div>
  );
}

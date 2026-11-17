import { useState } from "react";
import { usePopover } from "../hooks/usePopover";
import { guardarTexto, leerTexto, NIVEL_MAX } from "../lib/texto";
import { IconTexto } from "./icons";

// Botón "Aa": aumenta/disminuye el tamaño de la letra (nunca menos que el tamaño original) y activa/desactiva la negrita.
export default function TextControls() {
  const [texto, setTexto] = useState(leerTexto);
  const { abierto, setAbierto, ref } = usePopover();

  const cambiar = (parcial) => {
    const nuevo = { ...texto, ...parcial };
    setTexto(nuevo);
    guardarTexto(nuevo);
  };

  return (
    <div className="adm-pop" ref={ref}>
      <button type="button" className="adm-btn adm-btn-sm adm-icon-btn" aria-label="Tamaño y grosor de letra" aria-haspopup="true" aria-expanded={abierto} title="Tamaño de letra" onClick={() => setAbierto((v) => !v)}>
        <IconTexto />
      </button>
      {abierto && (
        <div className="adm-pop-panel adm-texto" role="group" aria-label="Tamaño y grosor de letra">
          <strong className="adm-pop-title">Tamaño de letra</strong>
          <div className="adm-texto-fila">
            <button type="button" className="adm-btn adm-btn-sm" aria-label="Disminuir tamaño de letra" disabled={texto.nivel === 0} onClick={() => cambiar({ nivel: texto.nivel - 1 })}>A−</button>
            <span className="adm-texto-nivel" aria-live="polite">{texto.nivel === 0 ? "Normal" : `Nivel ${texto.nivel} de ${NIVEL_MAX}`}</span>
            <button type="button" className="adm-btn adm-btn-sm" aria-label="Aumentar tamaño de letra" disabled={texto.nivel === NIVEL_MAX} onClick={() => cambiar({ nivel: texto.nivel + 1 })}>A+</button>
          </div>
          <button type="button" className="adm-btn adm-btn-sm" style={{ width: "100%" }} aria-pressed={texto.negrita} onClick={() => cambiar({ negrita: !texto.negrita })}>
            <b>N</b>&nbsp;Negrita: {texto.negrita ? "activada" : "desactivada"}
          </button>
          {(texto.nivel > 0 || texto.negrita) && (
            <button type="button" className="adm-link adm-texto-reset" onClick={() => cambiar({ nivel: 0, negrita: false })}>Restablecer</button>
          )}
        </div>
      )}
    </div>
  );
}
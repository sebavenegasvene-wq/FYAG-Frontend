import { useState } from "react";
import { useLocation } from "react-router-dom";
import { getRole } from "../api/auth";
import { ayudaPara } from "../lib/ayuda";

// Botón de ayuda visible en cada pantalla: abre un minitutorial según el rol, sin sacar al usuario de la vista (HU-28).
export default function HelpButton() {
  const { pathname } = useLocation();
  const [abierto, setAbierto] = useState(false);
  const ayuda = ayudaPara(pathname, getRole());
  if (!ayuda) return null;
  return (
    <>
      {abierto && (
        <aside className="adm-help" role="dialog" aria-label={`Ayuda: ${ayuda.titulo}`}>
          <button className="adm-help-close" aria-label="Cerrar ayuda" onClick={() => setAbierto(false)}>×</button>
          <h2>{ayuda.titulo}</h2>
          <p>{ayuda.texto}</p>
          {ayuda.pasos?.length > 0 && <>
            <h3>Cómo se usa</h3>
            <ol>{ayuda.pasos.map((p) => <li key={p}>{p}</li>)}</ol>
          </>}
          {ayuda.limites?.length > 0 && (
            <div className="adm-help-box limites">
              <h3>🔒 Lo que no puedes hacer</h3>
              <ul>{ayuda.limites.map((l) => <li key={l}>{l}</li>)}</ul>
            </div>
          )}
          {ayuda.depende?.length > 0 && (
            <div className="adm-help-box depende">
              <h3>⏳ Depende de otros</h3>
              <ul>{ayuda.depende.map((d) => <li key={d}>{d}</li>)}</ul>
            </div>
          )}
        </aside>
      )}
      <button className="adm-help-btn" aria-label="Ayuda de esta pantalla" aria-expanded={abierto} onClick={() => setAbierto((v) => !v)}>?</button>
    </>
  );
}
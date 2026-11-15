import { useState } from "react";
import { useLocation } from "react-router-dom";
import { AYUDA } from "../lib/ayuda";

// Botón de ayuda visible en cada pantalla: abre un minitutorial sin sacar al usuario de la vista (HU-28).
export default function HelpButton() {
  const { pathname } = useLocation();
  const [abierto, setAbierto] = useState(false);
  const ayuda = AYUDA[pathname];
  if (!ayuda) return null;
  return (
    <>
      {abierto && (
        <aside className="adm-help" role="dialog" aria-label={`Ayuda: ${ayuda.titulo}`}>
          <button className="adm-help-close" aria-label="Cerrar ayuda" onClick={() => setAbierto(false)}>×</button>
          <h2>{ayuda.titulo}</h2>
          <p>{ayuda.texto}</p>
          <ol>{ayuda.pasos.map((p) => <li key={p}>{p}</li>)}</ol>
        </aside>
      )}
      <button className="adm-help-btn" aria-label="Ayuda de esta pantalla" aria-expanded={abierto} onClick={() => setAbierto((v) => !v)}>?</button>
    </>
  );
}

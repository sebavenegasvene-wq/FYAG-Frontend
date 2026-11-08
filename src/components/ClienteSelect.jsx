import { useEffect, useState } from "react";
import { getClientes } from "../api/clientes";
import { lista } from "../lib/datos";

// Búsqueda de cliente por RUT o razón social (HU-01). value = objeto cliente seleccionado.
export default function ClienteSelect({ value, onChange, error }) {
  const [q, setQ] = useState("");
  const [res, setRes] = useState([]);
  const [buscando, setBuscando] = useState(false);

  useEffect(() => {
    if (q.trim().length < 2) return undefined;
    const t = setTimeout(async () => {
      setBuscando(true);
      try { setRes(lista(await getClientes({ busqueda: q.trim(), size: 6 })).slice(0, 6)); }
      catch { setRes([]); }
      finally { setBuscando(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  if (value) {
    return (
      <div className="adm-selected">
        <span><strong>{value.razonSocial}</strong> · {value.rut}</span>
        <button type="button" className="adm-link" onClick={() => onChange(null)}>Cambiar</button>
      </div>
    );
  }
  return (
    <div>
      <input id="f-cliente" className={`adm-input${error ? " error" : ""}`} placeholder="Escribe RUT o razón social (mín. 2 letras)" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
      {q.trim().length >= 2 && (
        <div className="adm-search-results" role="listbox">
          {buscando && <small className="adm-sub">Buscando...</small>}
          {!buscando && res.length === 0 && <small className="adm-sub">Sin resultados. Registra al cliente en el módulo Clientes.</small>}
          {res.map((c) => (
            <button type="button" key={c.id} role="option" aria-selected="false" onClick={() => { onChange(c); setQ(""); setRes([]); }}>
              <strong>{c.razonSocial}</strong><span>{c.rut}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

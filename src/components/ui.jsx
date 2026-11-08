import { useEffect, useRef } from "react";

export function Alert({ children, tipo }) {
  if (!children) return null;
  return <div className={`adm-alert${tipo === "ok" ? " ok" : ""}`} role={tipo === "ok" ? "status" : "alert"}>{children}</div>;
}

export function Toast({ children }) {
  if (!children) return null;
  return <div className="adm-toast" role="status">{children}</div>;
}

export function Pill({ tono, children }) {
  return <span className={`adm-pill${tono ? ` ${tono}` : ""}`}>{children}</span>;
}

// Etiqueta de estado a partir de un mapa { CLAVE: { label, tono } }
export function EstadoPill({ mapa, valor }) {
  const e = mapa[valor];
  return <Pill tono={e?.tono}>{e?.label ?? valor ?? "—"}</Pill>;
}

export function Kpi({ titulo, valor, detalle, tono, bloqueado }) {
  return (
    <article className={`adm-card adm-kpi ${bloqueado ? "locked" : tono ?? ""}`}>
      <span>{titulo}</span>
      <strong>{bloqueado ? "🔒 Sin acceso" : valor}</strong>
      <small>{bloqueado ? "Tu perfil no tiene permiso para ver este dato" : detalle}</small>
    </article>
  );
}

// Modal accesible: Escape y clic fuera cierran; enfoca el primer campo al abrir.
export function Modal({ titulo, descripcion, onClose, children, ancho, onSubmit, bloquear }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    el?.querySelector("input:not([type=hidden]), select, textarea")?.focus();
    const onKey = (e) => e.key === "Escape" && !bloquear && onClose?.();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, bloquear]);

  const Tag = onSubmit ? "form" : "section";
  return (
    <div className="adm-overlay" onMouseDown={(ev) => ev.target === ev.currentTarget && !bloquear && onClose?.()}>
      <Tag ref={ref} className={`adm-modal${ancho ? ` ${ancho}` : ""}`} role="dialog" aria-modal="true" aria-label={titulo}
        {...(onSubmit ? { onSubmit, noValidate: true } : {})}>
        <h2>{titulo}</h2>
        {descripcion && <p>{descripcion}</p>}
        {children}
      </Tag>
    </div>
  );
}

export function ConfirmModal({ titulo, texto, confirmar = "Confirmar", peligro, onCancel, onConfirm, cargando, error, children, deshabilitar }) {
  return (
    <Modal titulo={titulo} descripcion={texto} onClose={onCancel} bloquear={cargando}>
      <Alert>{error}</Alert>
      {children}
      <div className="adm-modal-actions">
        <button type="button" className="adm-btn" onClick={onCancel} disabled={cargando}>Cancelar</button>
        <button type="button" className={`adm-btn ${peligro ? "adm-btn-danger" : "adm-btn-primary"}`} disabled={cargando || deshabilitar} onClick={onConfirm}>
          {cargando ? "Procesando..." : confirmar}
        </button>
      </div>
    </Modal>
  );
}

export function Field({ label, name, error, hint, wide, children }) {
  return (
    <div className={`adm-field${wide ? " wide" : ""}`}>
      <label htmlFor={`f-${name}`}>{label}</label>
      {children}
      {hint && !error && <small className="hint">{hint}</small>}
      {error && <small role="alert">{error}</small>}
    </div>
  );
}

export function Pager({ data, pagina, setPagina, unidad = "registro(s)" }) {
  const total = data?.page?.totalPages ?? 0;
  return (
    <div className="adm-pager">
      <span>{data?.page?.totalElements ?? 0} {unidad} · Página {total ? pagina + 1 : 0} de {total}</span>
      <div>
        <button className="adm-btn adm-btn-sm" disabled={pagina === 0} onClick={() => setPagina((p) => p - 1)}>← Anterior</button>
        <button className="adm-btn adm-btn-sm" disabled={pagina + 1 >= total} onClick={() => setPagina((p) => p + 1)}>Siguiente →</button>
      </div>
    </div>
  );
}

// Tabla que en pantallas < 720px pasa a formato "tarjetas" (una bajo otra).
// columnas: [{ label, render(fila), num?, acciones? }]
export function DataTable({ columnas, filas, cargando, vacio = "No hay datos para mostrar.", rowKey = "id" }) {
  return (
    <div className="adm-table-scroll">
      <table className="adm-table stack">
        <thead>
          <tr>{columnas.map((c) => <th key={c.label} className={c.num ? "num" : undefined}>{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {cargando && <tr><td className="adm-empty" colSpan={columnas.length}>Cargando...</td></tr>}
          {!cargando && filas.length === 0 && <tr><td className="adm-empty" colSpan={columnas.length}>{vacio}</td></tr>}
          {!cargando && filas.map((f, i) => (
            <tr key={f[rowKey] ?? i}>
              {columnas.map((c) => (
                <td key={c.label} data-label={c.label} className={[c.num ? "num" : "", c.acciones ? "adm-actions-cell" : ""].join(" ").trim() || undefined}>
                  {c.acciones ? <div className="adm-actions">{c.render(f)}</div> : c.render(f)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Barras({ items, tono }) {
  const max = Math.max(1, ...items.map((i) => i.valor));
  if (!items.length) return <p className="adm-sub">Aún no hay datos para graficar.</p>;
  return (
    <div className="adm-bars">
      {items.map((i) => (
        <div className="adm-bar" key={i.label}>
          <span>{i.label}</span>
          <div><i className={i.tono ?? tono} style={{ width: `${(i.valor / max) * 100}%` }} /></div>
          <strong>{i.valor}</strong>
        </div>
      ))}
    </div>
  );
}

const formatoCLP = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

export const clp = (valor) => formatoCLP.format(Number(valor ?? 0));

// Acepta "2026-10-20" o "2026-10-20T14:32:00"
export const fecha = (f) => {
  if (!f) return "—";
  const d = new Date(String(f).length <= 10 ? `${f}T00:00:00` : f);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("es-CL");
};

// Fecha de hoy en formato yyyy-mm-dd (hora local) para inputs type="date"
export const hoy = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

export const diasAtraso = (vencimiento) => {
  if (!vencimiento) return 0;
  const dif = Math.floor((new Date(`${hoy()}T00:00:00`) - new Date(`${vencimiento}T00:00:00`)) / 86400000);
  return Math.max(0, dif);
};

// "costoManoObra" -> "Costo mano obra"
export const humanizar = (clave) => {
  const t = String(clave).replace(/([A-Z])/g, " $1").replace(/_/g, " ").trim().toLowerCase();
  return t.charAt(0).toUpperCase() + t.slice(1);
};

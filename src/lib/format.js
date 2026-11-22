// FORMATO DE DATOS: funciones para mostrar plata y fechas en formato chileno.
const formatoCLP = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

// Convierte un número a pesos chilenos, ej: 15000 → $15.000
export const clp = (valor) => formatoCLP.format(Number(valor ?? 0));

// Acepta "2026-10-20" o "2026-10-20T14:32:00"
// Convierte una fecha del backend a dd-mm-aaaa; si no hay fecha muestra —
export const fecha = (f) => {
  if (!f) return "—";
  const d = new Date(String(f).length <= 10 ? `${f}T00:00:00` : f);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("es-CL");
};

// Fecha de hoy en formato yyyy-mm-dd (hora local) para inputs type="date"
// Fecha de hoy con hora local (para los campos de tipo fecha)
export const hoy = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

// Cuántos días lleva vencida una factura (0 si aún no vence)
export const diasAtraso = (vencimiento) => {
  if (!vencimiento) return 0;
  const dif = Math.floor((new Date(`${hoy()}T00:00:00`) - new Date(`${vencimiento}T00:00:00`)) / 86400000);
  return Math.max(0, dif);
};

// "costoManoObra" -> "Costo mano obra"
// Convierte nombres técnicos en texto legible
export const humanizar = (clave) => {
  const t = String(clave).replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/_/g, " ").trim().toLowerCase();
  return t.charAt(0).toUpperCase() + t.slice(1);
};
// Rango de un mes calendario (offset 0 = mes actual hasta hoy, -1 = mes anterior completo) en formato yyyy-mm-dd
// Agrega un 0 delante si hace falta (5 → 05)
const pad = (n) => String(n).padStart(2, "0");
// Arma la fecha en formato aaaa-mm-dd
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
// Devuelve el primer y último día de un mes (para las descargas rápidas de reportes)
export const rangoMes = (offset = 0) => {
  const h = new Date();
  const ini = new Date(h.getFullYear(), h.getMonth() + offset, 1);
  const fin = offset === 0 ? h : new Date(h.getFullYear(), h.getMonth() + offset + 1, 0);
  return { desde: iso(ini), hasta: iso(fin), mes: ini.toLocaleDateString("es-CL", { month: "long", year: "numeric" }) };
};

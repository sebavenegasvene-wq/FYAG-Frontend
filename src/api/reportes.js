import client from "./client";

// formato: valor del enum FormatoReporte (revisa tu enum)
export const descargarReporteObras = (params) =>
  client.get("/reportes/obras", { params, responseType: "blob" }).then((r) => r.data);
export const descargarReporteCobranzas = (params) =>
  client.get("/reportes/cobranzas", { params, responseType: "blob" }).then((r) => r.data);

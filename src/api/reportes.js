// Descarga de reportes en PDF o Excel. 'blob' significa que la respuesta es un archivo, no texto.
import client from "./client";

// formato: valor del enum FormatoReporte (revisa tu enum)
// Reporte de obras
export const descargarReporteObras = (params) =>
  client.get("/reportes/obras", { params, responseType: "blob" }).then((r) => r.data);
// Reporte de cobranzas
export const descargarReporteCobranzas = (params) =>
  client.get("/reportes/cobranzas", { params, responseType: "blob" }).then((r) => r.data);

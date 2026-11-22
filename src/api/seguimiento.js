// Seguimiento paso a paso (como rastrear un paquete) de una obra o un presupuesto.
import client from "./client";

// Seguimiento tipo "rastreo de paquete": { resumen, pasos: [{ titulo, detalle, responsable, fecha, estado }] }
// Pasos de una obra
export const getSeguimientoObra = (id) => client.get(`/obras/${id}/seguimiento`).then((r) => r.data);
// Pasos de un presupuesto
export const getSeguimientoPresupuesto = (id) => client.get(`/presupuestos/${id}/seguimiento`).then((r) => r.data);

import client from "./client";

// Seguimiento tipo "rastreo de paquete": { resumen, pasos: [{ titulo, detalle, responsable, fecha, estado }] }
export const getSeguimientoObra = (id) => client.get(`/obras/${id}/seguimiento`).then((r) => r.data);
export const getSeguimientoPresupuesto = (id) => client.get(`/presupuestos/${id}/seguimiento`).then((r) => r.data);

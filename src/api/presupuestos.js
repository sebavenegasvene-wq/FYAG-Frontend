// Llamadas al backend de presupuestos (cotizaciones).
import client from "./client";

// Lista de presupuestos (se puede filtrar por estado)
export const getPresupuestos = (params) => client.get("/presupuestos", { params }).then((r) => r.data); // ?estado=
// Solo los presupuestos aprobados (sirven para crear obras)
export const getAprobados = () => client.get("/presupuestos/aprobados").then((r) => r.data);
// Un presupuesto por su id
export const getPresupuesto = (id) => client.get(`/presupuestos/${id}`).then((r) => r.data);
// Crea un presupuesto nuevo (queda Pendiente)
export const createPresupuesto = (data) => client.post("/presupuestos", data).then((r) => r.data);
// Modifica un presupuesto (solo mientras no esté aprobado)
export const updatePresupuesto = (id, data) => client.put(`/presupuestos/${id}`, data).then((r) => r.data);
// Aprueba el presupuesto; el backend genera el PDF
export const aprobarPresupuesto = (id) => client.patch(`/presupuestos/${id}/aprobar`).then((r) => r.data);
// Rechaza el presupuesto indicando el motivo
export const rechazarPresupuesto = (id, data) => client.patch(`/presupuestos/${id}/rechazar`, data).then((r) => r.data);
// Descarga el PDF institucional (llega como archivo 'blob')
export const getPresupuestoPdf = (id) =>
  client.get(`/presupuestos/${id}/pdf`, { responseType: "blob" }).then((r) => r.data);

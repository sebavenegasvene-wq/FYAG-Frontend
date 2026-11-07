import client from "./client";

export const getPresupuestos = (params) => client.get("/presupuestos", { params }).then((r) => r.data); // ?estado=
export const getAprobados = () => client.get("/presupuestos/aprobados").then((r) => r.data);
export const getPresupuesto = (id) => client.get(`/presupuestos/${id}`).then((r) => r.data);
export const createPresupuesto = (data) => client.post("/presupuestos", data).then((r) => r.data);
export const updatePresupuesto = (id, data) => client.put(`/presupuestos/${id}`, data).then((r) => r.data);
export const aprobarPresupuesto = (id) => client.patch(`/presupuestos/${id}/aprobar`).then((r) => r.data);
export const rechazarPresupuesto = (id, data) => client.patch(`/presupuestos/${id}/rechazar`, data).then((r) => r.data);
export const getPresupuestoPdf = (id) =>
  client.get(`/presupuestos/${id}/pdf`, { responseType: "blob" }).then((r) => r.data);

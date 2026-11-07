import client from "./client";

export const getTiposServicio = (incluirInactivos = false) =>
  client.get("/tipos-servicio", { params: { incluirInactivos } }).then((r) => r.data);
export const createTipoServicio = (data) => client.post("/tipos-servicio", data).then((r) => r.data);
export const updateTipoServicio = (id, data) => client.put(`/tipos-servicio/${id}`, data).then((r) => r.data);
export const cambiarEstadoTipoServicio = (id, data) =>
  client.patch(`/tipos-servicio/${id}/estado`, data).then((r) => r.data);

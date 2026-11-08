import client from "./client";

export const getObras = (params) => client.get("/obras", { params }).then((r) => r.data); // ?estado=&page=&size=
export const getObra = (id) => client.get(`/obras/${id}`).then((r) => r.data);
export const createObra = (data) => client.post("/obras", data).then((r) => r.data);
export const cambiarEstadoObra = (id, data) => client.patch(`/obras/${id}/estado`, data).then((r) => r.data);

export const getCostos = (obraId) => client.get(`/obras/${obraId}/costos`).then((r) => r.data);
export const registrarCostos = (obraId, data) => client.put(`/obras/${obraId}/costos`, data).then((r) => r.data);
export const getRentabilidad = (obraId) => client.get(`/obras/${obraId}/rentabilidad`).then((r) => r.data);

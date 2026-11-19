import client from "./client";

export const getIncidencias = (obraId) => client.get(`/obras/${obraId}/incidencias`).then((r) => r.data);
export const registrarIncidencia = (obraId, data) => client.post(`/obras/${obraId}/incidencias`, data).then((r) => r.data);
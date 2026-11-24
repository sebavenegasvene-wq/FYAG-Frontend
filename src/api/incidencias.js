// Novedades (incidencias) de una obra.
import client from "./client";

// Lista las novedades de una obra
export const getIncidencias = (obraId) => client.get(`/obras/${obraId}/incidencias`).then((r) => r.data);
// Registra una novedad nueva en la obra
export const registrarIncidencia = (obraId, data) => client.post(`/obras/${obraId}/incidencias`, data).then((r) => r.data);
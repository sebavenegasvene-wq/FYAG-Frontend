// Llamadas al backend de obras.
import client from "./client";

// Lista de obras (filtra por estado y por página)
export const getObras = (params) => client.get("/obras", { params }).then((r) => r.data); // ?estado=&page=&size=
// Una obra por su id
export const getObra = (id) => client.get(`/obras/${id}`).then((r) => r.data);
// Crea una obra nueva (desde un presupuesto aprobado)
export const createObra = (data) => client.post("/obras", data).then((r) => r.data);
// Cambia el estado de la obra (En proceso, Finalizada, Suspendida, Cancelada)
export const cambiarEstadoObra = (id, data) => client.patch(`/obras/${id}/estado`, data).then((r) => r.data);

// Lee los costos reales (materiales y horas) de la obra
export const getCostos = (obraId) => client.get(`/obras/${obraId}/costos`).then((r) => r.data);
// Guarda los costos reales de la obra
export const registrarCostos = (obraId, data) => client.put(`/obras/${obraId}/costos`, data).then((r) => r.data);
// Compara presupuesto y costo real para saber si la obra fue rentable
export const getRentabilidad = (obraId) => client.get(`/obras/${obraId}/rentabilidad`).then((r) => r.data);

// Asigna o cambia el técnico responsable de la obra (HU-07)
export const asignarTecnicoObra = (id, tecnicoId) => client.patch(`/obras/${id}/tecnico`, { tecnicoId }).then((r) => r.data);
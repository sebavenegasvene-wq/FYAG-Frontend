// Llamadas al backend de tipos de servicio (categorías de obra).
import client from "./client";

// Lista los tipos; por defecto solo los activos
export const getTiposServicio = (incluirInactivos = false) =>
  client.get("/tipos-servicio", { params: { incluirInactivos } }).then((r) => r.data);
// Crea un tipo nuevo
export const createTipoServicio = (data) => client.post("/tipos-servicio", data).then((r) => r.data);
// Cambia el nombre de un tipo
export const updateTipoServicio = (id, data) => client.put(`/tipos-servicio/${id}`, data).then((r) => r.data);
// Activa o desactiva un tipo (no se borra)
export const cambiarEstadoTipoServicio = (id, data) =>
  client.patch(`/tipos-servicio/${id}/estado`, data).then((r) => r.data);

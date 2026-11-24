// Llamadas al backend del historial de auditoría (quién hizo qué y cuándo).
import client from "./client";

// Todos los registros
export const getAuditoria = (params) => client.get("/auditoria", { params }).then((r) => r.data);
// Registros de una persona
export const getAuditoriaPorUsuario = (usuarioId, params) =>
  client.get(`/auditoria/usuario/${usuarioId}`, { params }).then((r) => r.data);
// Registros entre dos fechas
export const getAuditoriaPorFecha = (params) => client.get("/auditoria/fecha", { params }).then((r) => r.data); // ?desde=&hasta=
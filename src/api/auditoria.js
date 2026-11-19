import client from "./client";

export const getAuditoria = (params) => client.get("/auditoria", { params }).then((r) => r.data);
export const getAuditoriaPorUsuario = (usuarioId, params) =>
  client.get(`/auditoria/usuario/${usuarioId}`, { params }).then((r) => r.data);
export const getAuditoriaPorFecha = (params) => client.get("/auditoria/fecha", { params }).then((r) => r.data); // ?desde=&hasta=
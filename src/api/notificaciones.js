import client from "./client";

// { noLeidas, items: [{ id, tipo, mensaje, tono, obraId, leida, fechaCreacion }] }
export const getNotificaciones = () => client.get("/notificaciones").then((r) => r.data);
export const marcarNotificacionLeida = (id) => client.patch(`/notificaciones/${id}/leida`);
export const marcarTodasLeidas = () => client.patch("/notificaciones/leidas");
// Avisos (campana) del usuario; viven en el servidor.
import client from "./client";

// { noLeidas, items: [{ id, tipo, mensaje, tono, obraId, leida, fechaCreacion }] }
// Trae los avisos y cuántos faltan por leer
export const getNotificaciones = () => client.get("/notificaciones").then((r) => r.data);
// Marca un aviso como leído
export const marcarNotificacionLeida = (id) => client.patch(`/notificaciones/${id}/leida`);
// Marca todos los avisos como leídos
export const marcarTodasLeidas = () => client.patch("/notificaciones/leidas");
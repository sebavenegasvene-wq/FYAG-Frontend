// Tipos de novedad que puede dejar un técnico (deben coincidir con TipoIncidencia del backend)
// Tipos de novedad con su texto y color (tono)
export const TIPO_INCIDENCIA = {
  COMENTARIO: { label: "Comentario", tono: "info" },
  AUSENCIA: { label: "No asistió / ausencia", tono: "bad" },
  RETRASO: { label: "Retraso", tono: "warn" },
  FALTA_MATERIAL: { label: "Falta de materiales", tono: "warn" },
  PROBLEMA_ACCESO: { label: "Problema de acceso", tono: "warn" },
};

// Una obra cerrada ya no admite novedades (el backend también lo valida)
// Estados en que todavía se puede registrar una novedad
export const ESTADOS_ABIERTOS = ["EN_PROCESO", "SUSPENDIDA"];
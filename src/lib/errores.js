// Mensaje legible a partir del ProblemDetail del backend
export const mensajeError = (error, porDefecto = "No se pudo completar la acción. Intenta de nuevo.") => {
  const status = error?.response?.status;
  const data = error?.response?.data;
  if (status === 403) return data?.detail || "No tienes permisos para esta acción.";
  if (!error?.response) return "No hay conexión con el servidor. Revisa tu internet e intenta de nuevo.";
  return data?.detail || data?.message || porDefecto;
};

// Errores por campo que devuelve @Valid (data.errores / data.errors)
export const erroresPorCampo = (error) => error?.response?.data?.errores ?? error?.response?.data?.errors ?? {};

// El backend a veces responde una página { content, page } y a veces una lista simple.
// Normaliza la respuesta del backend: siempre devuelve una lista, venga como página o como lista simple
export const lista = (data) => (Array.isArray(data) ? data : data?.content ?? data?.items ?? []);
// Página vacía para usar mientras se cargan los datos
export const paginaVacia = { content: [], page: { totalPages: 0, totalElements: 0 } };
// Total de registros de una respuesta paginada
export const totalDe = (pagina) => pagina?.page?.totalElements ?? pagina?.totalElements ?? lista(pagina).length;

// Primer valor definido entre varias claves posibles (tolera variaciones del DTO)
// Devuelve el primer dato que exista entre varios nombres posibles
export const pick = (obj, ...claves) => claves.map((c) => obj?.[c]).find((v) => v !== undefined && v !== null && v !== "");

// Descarga un Blob (PDF/Excel) en el navegador
// Descarga un archivo (PDF/Excel) creando un enlace invisible y haciéndole clic
export const descargarBlob = (blob, nombre) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

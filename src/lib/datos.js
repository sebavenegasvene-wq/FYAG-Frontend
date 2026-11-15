// El backend a veces responde una página { content, page } y a veces una lista simple.
export const lista = (data) => (Array.isArray(data) ? data : data?.content ?? data?.items ?? []);
export const paginaVacia = { content: [], page: { totalPages: 0, totalElements: 0 } };
export const totalDe = (pagina) => pagina?.page?.totalElements ?? pagina?.totalElements ?? lista(pagina).length;

// Primer valor definido entre varias claves posibles (tolera variaciones del DTO)
export const pick = (obj, ...claves) => claves.map((c) => obj?.[c]).find((v) => v !== undefined && v !== null && v !== "");

// Descarga un Blob (PDF/Excel) en el navegador
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

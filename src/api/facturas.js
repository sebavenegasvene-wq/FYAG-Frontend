// Llamadas al backend de facturas y cobranzas.
import client from "./client";

// Lista de facturas (se puede filtrar por estado de pago)
export const getFacturas = (params) => client.get("/facturas", { params }).then((r) => r.data); // ?estadoPago=
// Una factura por su id
export const getFactura = (id) => client.get(`/facturas/${id}`).then((r) => r.data);
// Emite una factura (solo sobre obras finalizadas)
export const emitirFactura = (data) => client.post("/facturas", data).then((r) => r.data);
// Marca la factura como pagada con su fecha
export const registrarPago = (id, data) => client.patch(`/facturas/${id}/pago`, data).then((r) => r.data);
// Anula un pago registrado por error (no borra nada, queda historial)
export const anularPago = (id, data) => client.patch(`/facturas/${id}/anular-pago`, data).then((r) => r.data);
// Clientes que todavía deben dinero
export const getClientesPendientes = (params) =>
  client.get("/facturas/clientes-pendientes", { params }).then((r) => r.data);
// Obras finalizadas que aún se pueden facturar
export const getObrasFacturables = () => client.get("/facturas/obras-facturables").then((r) => r.data);

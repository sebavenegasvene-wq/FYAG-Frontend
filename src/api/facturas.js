import client from "./client";

export const getFacturas = (params) => client.get("/facturas", { params }).then((r) => r.data); // ?estadoPago=
export const getFactura = (id) => client.get(`/facturas/${id}`).then((r) => r.data);
export const emitirFactura = (data) => client.post("/facturas", data).then((r) => r.data);
export const registrarPago = (id, data) => client.patch(`/facturas/${id}/pago`, data).then((r) => r.data);
export const anularPago = (id, data) => client.patch(`/facturas/${id}/anular-pago`, data).then((r) => r.data);
export const getClientesPendientes = (params) =>
  client.get("/facturas/clientes-pendientes", { params }).then((r) => r.data);

import client from "./client";

export const getClientes = (params) => client.get("/clientes", { params }).then((r) => r.data); // ?busqueda=
export const getCliente = (id) => client.get(`/clientes/${id}`).then((r) => r.data);
export const createCliente = (data) => client.post("/clientes", data).then((r) => r.data);
export const updateCliente = (id, data) => client.put(`/clientes/${id}`, data).then((r) => r.data);

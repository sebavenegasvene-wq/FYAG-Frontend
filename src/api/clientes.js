// Llamadas al backend de clientes (GET = leer, POST = crear, PUT = modificar).
import client from "./client";

// Lista de clientes (se puede buscar por RUT o nombre)
export const getClientes = (params) => client.get("/clientes", { params }).then((r) => r.data); // ?busqueda=
// Un cliente por su id
export const getCliente = (id) => client.get(`/clientes/${id}`).then((r) => r.data);
// Crea un cliente nuevo
export const createCliente = (data) => client.post("/clientes", data).then((r) => r.data);
// Modifica los datos de un cliente
export const updateCliente = (id, data) => client.put(`/clientes/${id}`, data).then((r) => r.data);

// Pide al backend los números del dashboard (ventas, obras en proceso, cuentas por cobrar...).
import client from "./client";

export const getDashboard = () => client.get("/dashboard").then((r) => r.data);

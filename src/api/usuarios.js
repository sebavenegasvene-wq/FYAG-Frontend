import client from "./client";

export const getUsuarios = (params) => client.get("/usuarios", { params }).then((r) => r.data); // ?role=&activo=
export const getTecnicos = () => client.get("/usuarios/tecnicos").then((r) => r.data);
export const getPerfil = () => client.get("/usuarios/me").then((r) => r.data);
export const cambiarPassword = (data) => client.patch("/usuarios/me/password", data);
export const getUsuario = (username) => client.get(`/usuarios/${username}`).then((r) => r.data);
export const createUsuario = (data) => client.post("/usuarios", data).then((r) => r.data);
export const updateUsuario = (username, data) => client.put(`/usuarios/${username}`, data).then((r) => r.data);
export const cambiarRol = (username, data) => client.patch(`/usuarios/${username}/cuenta`, data).then((r) => r.data);
export const cambiarEstadoUsuario = (username, data) => client.patch(`/usuarios/${username}/estado`, data).then((r) => r.data);
export const resetPassword = (username) => client.post(`/usuarios/${username}/reset-password`).then((r) => r.data);
export const desbloquearUsuario = (username) => client.patch(`/usuarios/${username}/desbloqueo`).then((r) => r.data);

// Llamadas al backend de usuarios y de mi perfil.
import client from "./client";

// Lista de usuarios (filtra por rol o por activo)
export const getUsuarios = (params) => client.get("/usuarios", { params }).then((r) => r.data); // ?role=&activo=
// Solo los técnicos (para asignarlos a obras)
export const getTecnicos = () => client.get("/usuarios/tecnicos").then((r) => r.data);
// Datos del usuario que tiene la sesión iniciada
export const getPerfil = () => client.get("/usuarios/me").then((r) => r.data);
// El backend actualiza los datos propios en PUT /usuarios/{username} (solo si coincide con el usuario autenticado).
// Cambia mis propios datos (nombre, correo, teléfono)
export const actualizarPerfil = async (data) => {
  const username = localStorage.getItem("username") ?? (await getPerfil()).username;
  return client.put(`/usuarios/${encodeURIComponent(username)}`, data).then((r) => r.data);
};
// Cambia mi contraseña
export const cambiarPassword = (data) => client.patch("/usuarios/me/password", data);
// Un usuario por su nombre de usuario
export const getUsuario = (username) => client.get(`/usuarios/${username}`).then((r) => r.data);
// Crea una cuenta nueva (solo el Administrador)
export const createUsuario = (data) => client.post("/usuarios", data).then((r) => r.data);
// Modifica los datos de otro usuario
export const updateUsuario = (username, data) => client.put(`/usuarios/${username}`, data).then((r) => r.data);
// Cambia el perfil/rol de un usuario
export const cambiarRol = (username, data) => client.patch(`/usuarios/${username}/cuenta`, data).then((r) => r.data);
// Activa o desactiva una cuenta (no se elimina)
export const cambiarEstadoUsuario = (username, data) => client.patch(`/usuarios/${username}/estado`, data).then((r) => r.data);
// Genera una nueva contraseña temporal
export const resetPassword = (username) => client.post(`/usuarios/${username}/reset-password`).then((r) => r.data);
// Desbloquea una cuenta bloqueada por intentos fallidos
export const desbloquearUsuario = (username) => client.patch(`/usuarios/${username}/desbloqueo`).then((r) => r.data);
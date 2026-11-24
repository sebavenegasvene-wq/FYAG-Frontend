// SESIÓN: iniciar/cerrar sesión y guardar datos del usuario en el navegador (localStorage).
import client from "./client";
import { getPerfil } from "./usuarios";

// Pantalla inicial de cada rol (hoy todos parten en /inicio)
export const ROLE_HOME = {
  ADMIN: "/inicio",
  GERENCIA: "/inicio",
  FINANZAS: "/inicio",
  SUPERVISOR: "/inicio",
  TECNICO: "/inicio",
};

// Devuelve la pantalla inicial según el rol; si el rol no existe, manda al login
export const homeFor = (role) => ROLE_HOME[role] ?? "/login";
// Lee el rol guardado del usuario actual
export const getRole = () => localStorage.getItem("role");

// Guarda en localStorage los datos del perfil que necesita el frontend
export const guardarPerfil = (perfil) => {
  localStorage.setItem("role", perfil.role);
  localStorage.setItem("username", perfil.username);
  localStorage.setItem("debeCambiarPassword", String(perfil.debeCambiarPassword));
};

// Inicia sesión: envía usuario y contraseña, guarda los tokens JWT y luego guarda el perfil
export const login = async (username, password) => {
  const { data } = await client.post("/login", { username, password });
  // token = permiso de corta duración que se envía en cada petición
  localStorage.setItem("token", data.token);
  // refreshToken = permite pedir un token nuevo sin volver a escribir la contraseña
  localStorage.setItem("refreshToken", data.refreshToken);
  const perfil = await getPerfil();
  guardarPerfil(perfil);
  return perfil;
};

// Cerrar sesión: borra todo lo guardado en el navegador
export const logout = () => localStorage.clear();
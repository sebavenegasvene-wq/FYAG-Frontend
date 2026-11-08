import client from "./client";
import { getPerfil } from "./usuarios";

export const ROLE_HOME = {
  ADMIN: "/admin",
  GERENCIA: "/gerencia",
  FINANZAS: "/finanzas",
  SUPERVISOR: "/supervisor",
  TECNICO: "/tecnico",
};

export const homeFor = (role) => ROLE_HOME[role] ?? "/login";
export const getRole = () => localStorage.getItem("role");

// Guarda en localStorage los datos del perfil que necesita el frontend
export const guardarPerfil = (perfil) => {
  localStorage.setItem("role", perfil.role);
  localStorage.setItem("username", perfil.username);
  localStorage.setItem("debeCambiarPassword", String(perfil.debeCambiarPassword));
};

export const login = async (username, password) => {
  const { data } = await client.post("/login", { username, password });
  localStorage.setItem("token", data.token);
  localStorage.setItem("refreshToken", data.refreshToken);
  const perfil = await getPerfil();
  guardarPerfil(perfil);
  return perfil;
};

export const logout = () => localStorage.clear();
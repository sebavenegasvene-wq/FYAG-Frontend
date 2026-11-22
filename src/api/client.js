// CLIENTE HTTP: todas las llamadas al backend pasan por aquí. Axios es la librería que hace las peticiones.
import axios from "axios";

// Crea el cliente con la URL base del backend (viene del archivo .env en VITE_API_URL)
const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
});

// ANTES de cada petición: agrega el token JWT en el encabezado Authorization para que el backend sepa quién es el usuario
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Guarda la renovación de token en curso para no pedirla muchas veces a la vez
let refreshing = null;

// DESPUÉS de cada respuesta: si el backend responde 401 (token vencido), intenta renovarlo solo
client.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    const refreshToken = localStorage.getItem("refreshToken");

    // Solo reintenta una vez (_retry) y solo si existe un refreshToken
    if (err.response?.status === 401 && !original._retry && refreshToken) {
      original._retry = true;
      try {
        // Pide un token nuevo usando el refreshToken
        refreshing ??= axios.post(
          `${import.meta.env.VITE_API_URL}/login/actualizar-token`,
          refreshToken,
          { headers: { "Content-Type": "text/plain" } }
        );
        const { data } = await refreshing;
        refreshing = null;
        localStorage.setItem("token", data.token);
        localStorage.setItem("refreshToken", data.refreshToken);
        // Repite la petición original con el token nuevo; el usuario ni se entera
        original.headers.Authorization = `Bearer ${data.token}`;
        return client(original);
      // Si no se pudo renovar, borra la sesión y manda al login
      } catch {
        refreshing = null;
        localStorage.clear();
        window.location.href = "/login";
      }
    }
    // Cualquier otro error se devuelve para que lo maneje cada pantalla
    return Promise.reject(err);
  }
);

// Se exporta para que lo usen los archivos de la carpeta api/
export default client;

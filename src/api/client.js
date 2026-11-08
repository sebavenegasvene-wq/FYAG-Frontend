import axios from "axios";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing = null;

client.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    const refreshToken = localStorage.getItem("refreshToken");

    if (err.response?.status === 401 && !original._retry && refreshToken) {
      original._retry = true;
      try {
        refreshing ??= axios.post(
          `${import.meta.env.VITE_API_URL}/login/actualizar-token`,
          refreshToken,
          { headers: { "Content-Type": "text/plain" } }
        );
        const { data } = await refreshing;
        refreshing = null;
        localStorage.setItem("token", data.token);
        localStorage.setItem("refreshToken", data.refreshToken);
        original.headers.Authorization = `Bearer ${data.token}`;
        return client(original);
      } catch {
        refreshing = null;
        localStorage.clear();
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export default client;

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/auth";
import { useForm } from "../hooks/useForm";
import "./Login.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const { form, handleChange } = useForm({ username: "", password: "" });
  const [serverError, setServerError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const getParam = (...keys) => {
      for (const key of keys) {
        const value = searchParams.get(key) || hashParams.get(key);
        if (value) return value;
      }
      return null;
    };

    const token = getParam("token", "accessToken", "access_token");
    const refreshToken = getParam("refreshToken", "refresh_token");
    const username = getParam("username", "user", "email");

    if (token && refreshToken) {
      localStorage.setItem("token", token);
      localStorage.setItem("refreshToken", refreshToken);
      if (username) localStorage.setItem("username", username);
      navigate("/admin", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setServerError(null);

    const submittedUsername = form.username.trim();

    try {
      await login(submittedUsername, form.password);
      navigate("/admin");
    } catch (error) {
      if (error.response?.status === 429) setServerError("Demasiados intentos. Espera 1 minuto.");
      else if (error.response?.status === 401) setServerError("Usuario o contraseña incorrectos.");
      else setServerError("Error al conectar con el servidor. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="fyag-login">
      <section className="fyag-login-card" aria-labelledby="fyag-login-title">
        <button
          type="button"
          className="fyag-help-button"
          aria-label="Ayuda para iniciar sesión"
          aria-expanded={showHelp}
          aria-controls="fyag-login-help"
          onClick={() => setShowHelp((visible) => !visible)}
        >
          ?
        </button>
        {showHelp && (
          <div className="fyag-help-popover" id="fyag-login-help" role="status">
            Ingresa tu nombre de usuario y contraseña. Si no puedes acceder, contacta al administrador.
          </div>
        )}
        <div className="fyag-login-badge">FYAG</div>
        <h1 id="fyag-login-title">Frío y Agroindustria SpA</h1>
        <p className="fyag-login-subtitle">Gestión Centralizada de Obras y Presupuestos</p>

        <form onSubmit={handleSubmit}>
          <label className="fyag-login-label" htmlFor="username">Nombre de usuario</label>
          <input
            id="username"
            name="username"
            type="text"
            value={form.username}
            onChange={handleChange}
            placeholder="tu_usuario"
            autoComplete="username"
            required
          />

          <label className="fyag-login-label" htmlFor="password">Contraseña</label>
          <input
            id="password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="••••••"
            autoComplete="current-password"
            required
          />

          {serverError && <div className="fyag-login-error" role="alert">{serverError}</div>}

          <button type="submit" disabled={loading}>
            {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
          </button>
        </form>
      </section>
    </main>
  );
}

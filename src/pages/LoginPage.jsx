import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/auth";
import "./Login.css";
import ThemeControls from "../components/ThemeControls";

const CUENTAS_RAPIDAS = [
  { rol: "Gerencia", nombre: "Camila Rojas", username: "gerencia", password: "gerencia" },
  { rol: "Finanzas", nombre: "Paula Soto", username: "finanzas", password: "finanzas" },
  { rol: "Supervisor", nombre: "Marcelo Fuentes", username: "supervisor", password: "supervisor" },
  { rol: "Técnico 1", nombre: "Diego Araya", username: "tecnico1", password: "tecnico1" },
  { rol: "Técnico 2", nombre: "Javier Mella", username: "tecnico2", password: "tecnico2" },
  { rol: "Administrador", nombre: "Admin del sistema", username: "admin", password: "admin" },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [quickLogin, setQuickLogin] = useState(false);
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
    const urlUsername = getParam("username", "user", "email");

    if (token && refreshToken) {
      localStorage.setItem("token", token);
      localStorage.setItem("refreshToken", refreshToken);
      if (urlUsername) localStorage.setItem("username", urlUsername);
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  const toggleQuickLogin = () => {
    const nextMode = !quickLogin;
    setQuickLogin(nextMode);
    setServerError(null);

    if (nextMode) {
      const primeraCuenta = CUENTAS_RAPIDAS[0];
      setUsername(primeraCuenta.username);
      setPassword(primeraCuenta.password);
    } else {
      setUsername("");
      setPassword("");
    }
  };

  const handleRoleSelect = (event) => {
    const selectedUsername = event.target.value;
    const cuenta = CUENTAS_RAPIDAS.find((c) => c.username === selectedUsername);
    if (cuenta) {
      setUsername(cuenta.username);
      setPassword(cuenta.password);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setServerError(null);

    const submittedUsername = username.trim();

    try {
      const perfil = await login(submittedUsername, password);
      // Contraseña temporal: debe cambiarla antes de entrar (HU-21)
      navigate(perfil.debeCambiarPassword ? "/cambiar-password" : "/dashboard", { replace: true });
    } catch (error) {
      if (error.response?.status === 429) setServerError("Demasiados intentos. Espera 15 minutos.");
      else if (error.response?.status === 401) setServerError("Usuario o contraseña incorrectos, o cuenta desactivada/bloqueada.");
      else setServerError("Error al conectar con el servidor. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="fyag-login">
      <div className="fyag-login-theme"><ThemeControls /></div>
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
            Ingresa tu nombre de usuario y contraseña, o usa el botón Inicio rápido para probar con un rol predefinido.
          </div>
        )}
        <div className="fyag-login-badge">FYAG</div>
        <h1 id="fyag-login-title">Frío y Agroindustria SpA</h1>
        <p className="fyag-login-subtitle">Gestión Centralizada de Obras y Presupuestos</p>

        <form onSubmit={handleSubmit}>
          <div className="fyag-login-label-row">
            <label className="fyag-login-label" htmlFor="username">
              {quickLogin ? "Rol" : "Nombre de usuario"}
            </label>
            <button
              type="button"
              className="fyag-quick-toggle"
              onClick={toggleQuickLogin}
            >
              {quickLogin ? "Ingreso manual" : "Inicio rápido"}
            </button>
          </div>

          {quickLogin ? (
            <select
              id="username"
              name="username"
              className="fyag-login-select"
              value={username}
              onChange={handleRoleSelect}
            >
              {CUENTAS_RAPIDAS.map((cuenta) => (
                <option key={cuenta.username} value={cuenta.username}>
                  {cuenta.rol} — {cuenta.nombre} ({cuenta.username})
                </option>
              ))}
            </select>
          ) : (
            <input
              id="username"
              name="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="tu_usuario"
              autoComplete="username"
              required
            />
          )}

          <label className="fyag-login-label" htmlFor="password">Contraseña</label>
          <input
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
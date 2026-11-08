import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cambiarPassword, getPerfil } from "../api/usuarios";
import { guardarPerfil, homeFor, logout } from "../api/auth";
import { useForm } from "../hooks/useForm";
import "./admin/admin.css";

export default function CambiarPasswordPage() {
  const navigate = useNavigate();
  const { form, errors, setErrors, handleChange, resetForm } = useForm({ passwordActual: "", passwordNueva: "", confirmar: "" });
  const [error, setError] = useState(null);
  const [ok, setOk] = useState(false);
  const [guardando, setGuardando] = useState(false);

  if (!localStorage.getItem("token")) {
    navigate("/login", { replace: true });
    return null;
  }

  const obligatorio = localStorage.getItem("debeCambiarPassword") === "true";

  const enviar = async (event) => {
    event.preventDefault();
    const e = {};
    if (!form.passwordActual) e.passwordActual = "Ingresa tu contraseña actual";
    if (form.passwordNueva.length < 8 || form.passwordNueva.length > 72) e.passwordNueva = "Debe tener entre 8 y 72 caracteres";
    else if (form.passwordNueva === form.passwordActual) e.passwordNueva = "Debe ser distinta a la actual";
    if (form.confirmar !== form.passwordNueva) e.confirmar = "Las contraseñas no coinciden";
    if (Object.keys(e).length) return setErrors(e);

    setGuardando(true);
    setError(null);
    try {
      await cambiarPassword({ passwordActual: form.passwordActual, passwordNueva: form.passwordNueva });
      const perfil = await getPerfil();
      guardarPerfil(perfil);
      resetForm();
      setOk(true);
      setTimeout(() => navigate(homeFor(perfil.role), { replace: true }), 1200);
    } catch (err) {
      setError(err.response?.data?.detail || "No se pudo cambiar la contraseña.");
    } finally {
      setGuardando(false);
    }
  };

  const salir = () => { logout(); navigate("/login", { replace: true }); };

  return (
    <main className="adm-page" style={{ display: "grid", placeItems: "center" }}>
      <form className="adm-card" style={{ width: "min(440px, 100%)" }} onSubmit={enviar} noValidate>
        <h1 style={{ margin: "0 0 6px", fontSize: 20 }}>{obligatorio ? "Debes cambiar tu contraseña" : "Cambiar mi contraseña"}</h1>
        <p className="adm-sub">
          {obligatorio
            ? "Tu cuenta usa una contraseña temporal. Define una nueva para continuar."
            : "Usa una contraseña de al menos 8 caracteres."}
        </p>
        {error && <div className="adm-alert" role="alert">{error}</div>}
        {ok && <div className="adm-alert ok" role="status">Contraseña actualizada. Redirigiendo...</div>}

        <div className="adm-field" style={{ marginBottom: 12 }}>
          <label htmlFor="pa">Contraseña actual</label>
          <input id="pa" name="passwordActual" type="password" className={`adm-input${errors.passwordActual ? " error" : ""}`} value={form.passwordActual} onChange={handleChange} autoComplete="current-password" />
          {errors.passwordActual && <small role="alert">{errors.passwordActual}</small>}
        </div>
        <div className="adm-field" style={{ marginBottom: 12 }}>
          <label htmlFor="pn">Nueva contraseña</label>
          <input id="pn" name="passwordNueva" type="password" className={`adm-input${errors.passwordNueva ? " error" : ""}`} value={form.passwordNueva} onChange={handleChange} autoComplete="new-password" />
          {errors.passwordNueva && <small role="alert">{errors.passwordNueva}</small>}
        </div>
        <div className="adm-field">
          <label htmlFor="pc">Confirmar nueva contraseña</label>
          <input id="pc" name="confirmar" type="password" className={`adm-input${errors.confirmar ? " error" : ""}`} value={form.confirmar} onChange={handleChange} autoComplete="new-password" />
          {errors.confirmar && <small role="alert">{errors.confirmar}</small>}
        </div>

        <div className="adm-modal-actions">
          {obligatorio
            ? <button type="button" className="adm-btn" onClick={salir}>Cerrar sesión</button>
            : <button type="button" className="adm-btn" onClick={() => navigate(-1)}>Volver</button>}
          <button type="submit" className="adm-btn adm-btn-primary" disabled={guardando || ok}>{guardando ? "Guardando..." : "Cambiar contraseña"}</button>
        </div>
      </form>
    </main>
  );
}
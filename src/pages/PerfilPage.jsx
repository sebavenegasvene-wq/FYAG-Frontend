import { useEffect, useState } from "react";
import { actualizarPerfil, cambiarPassword, getPerfil } from "../api/usuarios";
import { guardarPerfil } from "../api/auth";
import AppLayout from "../components/AppLayout";
import { Alert, Field, Toast } from "../components/ui";
import { useForm } from "../hooks/useForm";
import { useToast } from "../hooks/useToast";
import { erroresPorCampo, mensajeError } from "../lib/errores";
import { ROLE_LABEL } from "../lib/roles";

const DATOS_VACIOS = { nombre: "", apellido: "", email: "", telefono: "" };

// Mis datos: PUT /usuarios/me (endpoint 1). Solo nombre, apellido, correo y teléfono;
// usuario, RUT y perfil los gestiona el Administrador.
function DatosCuenta({ perfil, onActualizado, mostrar }) {
  const { form, errors, setErrors, handleChange, fillForm } = useForm(DATOS_VACIOS);
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  const cargarForm = (p) => fillForm({ nombre: p.nombre ?? "", apellido: p.apellido ?? "", email: p.email ?? "", telefono: p.telefono ?? "" });
  useEffect(() => { if (perfil) cargarForm(perfil); }, [perfil]); // eslint-disable-line react-hooks/exhaustive-deps

  const cancelar = () => { cargarForm(perfil); setErrors({}); setError(null); setEditando(false); };

  const guardar = async (ev) => {
    ev.preventDefault();
    const e = {};
    if (!form.nombre.trim()) e.nombre = "El nombre es obligatorio";
    if (!form.apellido.trim()) e.apellido = "El apellido es obligatorio";
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = "Correo no válido";
    if (Object.keys(e).length) return setErrors(e);
    setGuardando(true); setError(null);
    try {
      await actualizarPerfil({ nombre: form.nombre.trim(), apellido: form.apellido.trim(), email: form.email.trim(), telefono: form.telefono.trim() || null });
      await onActualizado();
      setEditando(false);
      mostrar("Datos actualizados.");
    } catch (err) { setErrors(erroresPorCampo(err)); setError(mensajeError(err, "No se pudieron actualizar los datos.")); }
    finally { setGuardando(false); }
  };

  const campo = (name, label, tipo = "text") => (
    <Field label={label} name={name} error={errors[name]}>
      <input id={`f-${name}`} name={name} type={tipo} className={`adm-input${errors[name] ? " error" : ""}`} value={form[name]} onChange={handleChange} autoComplete="off" />
    </Field>
  );
  const fijo = (titulo, valor) => <div><h3>{titulo}</h3><p>{valor || "—"}</p></div>;

  return (
    <section className="adm-card" aria-label="Datos de la cuenta">
      <div className="adm-toolbar">
        <div>
          <h2 className="adm-card-title">Datos de la cuenta</h2>
          <p className="adm-card-sub">Usuario, RUT y perfil los define el Administrador.</p>
        </div>
        {!editando && <button type="button" className="adm-btn" onClick={() => setEditando(true)} disabled={!perfil}>Editar datos</button>}
      </div>
      <Alert>{error}</Alert>
      {!perfil && <p className="adm-sub">Cargando...</p>}
      {perfil && !editando && (
        <div className="adm-detail">
          {fijo("USUARIO", perfil.username)}
          {fijo("PERFIL", ROLE_LABEL[perfil.role] ?? perfil.role)}
          {fijo("NOMBRE", `${perfil.nombre ?? ""} ${perfil.apellido ?? ""}`.trim())}
          {fijo("RUT", perfil.rut)}
          {fijo("CORREO", perfil.email)}
          {fijo("TELÉFONO", perfil.telefono)}
        </div>
      )}
      {perfil && editando && (
        <form onSubmit={guardar} noValidate>
          <div className="adm-form-grid">
            {campo("nombre", "Nombre")}
            {campo("apellido", "Apellido")}
            {campo("email", "Correo electrónico", "email")}
            {campo("telefono", "Teléfono (opcional)")}
          </div>
          <div className="adm-modal-actions">
            <button type="button" className="adm-btn" onClick={cancelar} disabled={guardando}>Cancelar</button>
            <button type="submit" className="adm-btn adm-btn-primary" disabled={guardando}>{guardando ? "Guardando..." : "Guardar cambios"}</button>
          </div>
        </form>
      )}
    </section>
  );
}

// Cambiar contraseña: PATCH /usuarios/me/password (endpoint 2, ya existente).
function CambioClave({ mostrar }) {
  const { form, errors, setErrors, handleChange, resetForm } = useForm({ passwordActual: "", passwordNueva: "", confirmar: "" });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  const enviar = async (ev) => {
    ev.preventDefault();
    const e = {};
    if (!form.passwordActual) e.passwordActual = "Ingresa tu contraseña actual";
    if (form.passwordNueva.length < 8 || form.passwordNueva.length > 72) e.passwordNueva = "Debe tener entre 8 y 72 caracteres";
    else if (form.passwordNueva === form.passwordActual) e.passwordNueva = "Debe ser distinta a la actual";
    if (form.confirmar !== form.passwordNueva) e.confirmar = "Las contraseñas no coinciden";
    if (Object.keys(e).length) return setErrors(e);
    setGuardando(true); setError(null);
    try {
      await cambiarPassword({ passwordActual: form.passwordActual, passwordNueva: form.passwordNueva });
      resetForm();
      mostrar("Contraseña actualizada.");
    } catch (err) { setError(mensajeError(err, "No se pudo cambiar la contraseña.")); }
    finally { setGuardando(false); }
  };

  const campo = (name, label, auto) => (
    <Field label={label} name={name} error={errors[name]}>
      <input id={`f-${name}`} name={name} type="password" className={`adm-input${errors[name] ? " error" : ""}`} value={form[name]} onChange={handleChange} autoComplete={auto} />
    </Field>
  );

  return (
    <form className="adm-card" onSubmit={enviar} noValidate style={{ marginTop: 16 }} aria-label="Cambiar contraseña">
      <h2 className="adm-card-title">Cambiar contraseña</h2>
      <p className="adm-card-sub">Usa entre 8 y 72 caracteres, distinta a la actual.</p>
      <Alert>{error}</Alert>
      <div className="adm-form-grid">
        <div className="wide">{campo("passwordActual", "Contraseña actual", "current-password")}</div>
        {campo("passwordNueva", "Nueva contraseña", "new-password")}
        {campo("confirmar", "Confirmar nueva contraseña", "new-password")}
      </div>
      <div className="adm-modal-actions">
        <button type="submit" className="adm-btn adm-btn-primary" disabled={guardando}>{guardando ? "Guardando..." : "Cambiar contraseña"}</button>
      </div>
    </form>
  );
}

export default function PerfilPage() {
  const [perfil, setPerfil] = useState(null);
  const [error, setError] = useState(null);
  const { aviso, mostrar } = useToast();

  const cargar = async () => {
    const p = await getPerfil();
    setPerfil(p);
    guardarPerfil(p); // mantiene role/username del frontend al día
  };
  useEffect(() => { cargar().catch((e) => setError(mensajeError(e, "No se pudo cargar tu perfil."))); }, []);

  return (
    <AppLayout title="Mi perfil" subtitle="Consulta los datos de tu cuenta, edítalos o cambia tu contraseña.">
      <Alert>{error}</Alert>
      <DatosCuenta perfil={perfil} onActualizado={cargar} mostrar={mostrar} />
      <CambioClave mostrar={mostrar} />
      <Toast>{aviso}</Toast>
    </AppLayout>
  );
}

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getUsuarios, createUsuario, cambiarRol, cambiarEstadoUsuario,
  resetPassword, desbloquearUsuario,
} from "../../api/usuarios";
import { useForm } from "../../hooks/useForm";
import AdminLayout from "./AdminLayout";

const ROLES = [
  { value: "GERENCIA", label: "Gerencia" },
  { value: "FINANZAS", label: "Finanzas" },
  { value: "SUPERVISOR", label: "Supervisor de Obras" },
  { value: "TECNICO", label: "Técnico" },
];
const ROLE_LABEL = { ADMIN: "Administrador", ...Object.fromEntries(ROLES.map((r) => [r.value, r.label])) };

const generarPassword = (largo = 12) => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const valores = crypto.getRandomValues(new Uint32Array(largo));
  return Array.from(valores, (v) => chars[v % chars.length]).join("");
};

// Mensaje legible a partir del ProblemDetail del backend
const mensajeError = (error) => {
  const data = error.response?.data;
  if (error.response?.status === 403) return "No tienes permisos para esta acción.";
  return data?.detail || data?.message || "No se pudo completar la acción. Intenta de nuevo.";
};

// Errores por campo que devuelve @Valid (por si vienen en data.errores / data.errors)
const erroresPorCampo = (error) => error.response?.data?.errores ?? error.response?.data?.errors ?? {};

const FORM_INICIAL = {
  nombre: "", apellido: "", rut: "", email: "", telefono: "",
  username: "", password: "", role: "TECNICO",
};

function validar(f) {
  const e = {};
  if (!f.nombre.trim()) e.nombre = "El nombre es obligatorio";
  if (!f.apellido.trim()) e.apellido = "El apellido es obligatorio";
  if (!/^\d{7,8}-[\dkK]$/.test(f.rut.trim())) e.rut = "Formato inválido (ej: 12345678-5)";
  if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) e.email = "Correo no válido";
  if (!/^[a-zA-Z0-9_]{4,20}$/.test(f.username) || ["me", "tecnicos"].includes(f.username)) {
    e.username = "4 a 20 caracteres: letras, números o _ (no 'me' ni 'tecnicos')";
  }
  if (f.password.length < 8 || f.password.length > 72) e.password = "Debe tener entre 8 y 72 caracteres";
  return e;
}

function Campo({ label, name, form, errors, onChange, type = "text", wide, hint, children }) {
  return (
    <div className={`adm-field${wide ? " wide" : ""}`}>
      <label htmlFor={`f-${name}`}>{label}</label>
      {children ?? (
        <input id={`f-${name}`} name={name} type={type} className={`adm-input${errors[name] ? " error" : ""}`}
          value={form[name]} onChange={onChange} autoComplete="off" />
      )}
      {hint && !errors[name] && <small className="hint">{hint}</small>}
      {errors[name] && <small role="alert">{errors[name]}</small>}
    </div>
  );
}

function CrearUsuarioModal({ onClose, onCreado }) {
  const { form, errors, setErrors, handleChange, fillForm } = useForm(FORM_INICIAL);
  const [guardando, setGuardando] = useState(false);
  const [errorServidor, setErrorServidor] = useState(null);

  const enviar = async (event) => {
    event.preventDefault();
    const e = validar(form);
    if (Object.keys(e).length) return setErrors(e);

    setGuardando(true);
    setErrorServidor(null);
    try {
      const creado = await createUsuario({
        ...form,
        nombre: form.nombre.trim(), apellido: form.apellido.trim(),
        rut: form.rut.trim(), email: form.email.trim(), telefono: form.telefono.trim() || null,
      });
      onCreado(creado, form.password);
    } catch (error) {
      setErrors(erroresPorCampo(error));
      setErrorServidor(mensajeError(error));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="adm-overlay" onMouseDown={(ev) => ev.target === ev.currentTarget && onClose()}>
      <form className="adm-modal" role="dialog" aria-modal="true" aria-labelledby="crear-titulo" onSubmit={enviar} noValidate>
        <h2 id="crear-titulo">Nueva cuenta de empleado</h2>
        <p>La contraseña es temporal: el usuario deberá cambiarla en su primer inicio de sesión.</p>
        {errorServidor && <div className="adm-alert" role="alert">{errorServidor}</div>}

        <div className="adm-form-grid">
          <Campo label="Nombre" name="nombre" form={form} errors={errors} onChange={handleChange} />
          <Campo label="Apellido" name="apellido" form={form} errors={errors} onChange={handleChange} />
          <Campo label="RUT" name="rut" form={form} errors={errors} onChange={handleChange} hint="Sin puntos y con guion: 12345678-5" />
          <Campo label="Teléfono (opcional)" name="telefono" form={form} errors={errors} onChange={handleChange} />
          <Campo label="Correo electrónico" name="email" type="email" form={form} errors={errors} onChange={handleChange} wide />
          <Campo label="Nombre de usuario" name="username" form={form} errors={errors} onChange={handleChange} />
          <Campo label="Perfil" name="role" form={form} errors={errors} onChange={handleChange}>
            <select id="f-role" name="role" className="adm-select" value={form.role} onChange={handleChange}>
              {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </Campo>
          <Campo label="Contraseña temporal" name="password" form={form} errors={errors} wide>
            <div className="adm-row">
              <input id="f-password" name="password" className={`adm-input${errors.password ? " error" : ""}`}
                value={form.password} onChange={handleChange} autoComplete="off" />
              <button type="button" className="adm-btn" onClick={() => fillForm({ password: generarPassword() })}>Generar</button>
            </div>
          </Campo>
        </div>

        <div className="adm-modal-actions">
          <button type="button" className="adm-btn" onClick={onClose}>Cancelar</button>
          <button type="submit" className="adm-btn adm-btn-primary" disabled={guardando}>
            {guardando ? "Creando..." : "Crear cuenta"}
          </button>
        </div>
      </form>
    </div>
  );
}

// Muestra la clave temporal una sola vez (el backend no la vuelve a entregar)
function CredencialesModal({ username, password, titulo, onClose }) {
  const [copiado, setCopiado] = useState(false);
  const copiar = async () => {
    try { await navigator.clipboard.writeText(password); setCopiado(true); } catch { /* el usuario puede copiarla a mano */ }
  };
  return (
    <div className="adm-overlay">
      <section className="adm-modal" role="dialog" aria-modal="true" aria-labelledby="cred-titulo">
        <h2 id="cred-titulo">{titulo}</h2>
        <p>Entrega estas credenciales al empleado. <strong>No se volverán a mostrar.</strong> Deberá cambiar la contraseña al ingresar.</p>
        <div className="adm-field"><label>Usuario</label><span className="adm-secret">{username}</span></div>
        <div className="adm-field"><label>Contraseña temporal</label><span className="adm-secret">{password}</span></div>
        <div className="adm-modal-actions">
          <button className="adm-btn" onClick={copiar}>{copiado ? "Copiada ✓" : "Copiar contraseña"}</button>
          <button className="adm-btn adm-btn-primary" onClick={onClose}>Listo</button>
        </div>
      </section>
    </div>
  );
}

function CambiarRolModal({ usuario, onClose, onGuardado }) {
  const [role, setRole] = useState(usuario.role);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  const guardar = async () => {
    setGuardando(true);
    setError(null);
    try {
      await cambiarRol(usuario.username, { role });
      onGuardado(`Perfil de ${usuario.username} actualizado.`);
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="adm-overlay" onMouseDown={(ev) => ev.target === ev.currentTarget && onClose()}>
      <section className="adm-modal" role="dialog" aria-modal="true" aria-labelledby="rol-titulo">
        <h2 id="rol-titulo">Cambiar perfil</h2>
        <p>{usuario.nombre} {usuario.apellido} ({usuario.username}). El cambio se aplica de inmediato.</p>
        {error && <div className="adm-alert" role="alert">{error}</div>}
        <div className="adm-field">
          <label htmlFor="nuevo-rol">Perfil</label>
          <select id="nuevo-rol" className="adm-select" value={role} onChange={(e) => setRole(e.target.value)}>
            {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
        <div className="adm-modal-actions">
          <button className="adm-btn" onClick={onClose}>Cancelar</button>
          <button className="adm-btn adm-btn-primary" disabled={guardando || role === usuario.role} onClick={guardar}>
            {guardando ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </section>
    </div>
  );
}

function ConfirmarModal({ titulo, texto, confirmar, peligro, onCancel, onConfirm, cargando, error }) {
  return (
    <div className="adm-overlay" onMouseDown={(ev) => ev.target === ev.currentTarget && onCancel()}>
      <section className="adm-modal" role="alertdialog" aria-modal="true" aria-labelledby="conf-titulo">
        <h2 id="conf-titulo">{titulo}</h2>
        <p>{texto}</p>
        {error && <div className="adm-alert" role="alert">{error}</div>}
        <div className="adm-modal-actions">
          <button className="adm-btn" onClick={onCancel}>Cancelar</button>
          <button className={`adm-btn ${peligro ? "adm-btn-danger" : "adm-btn-primary"}`} disabled={cargando} onClick={onConfirm}>
            {cargando ? "Procesando..." : confirmar}
          </button>
        </div>
      </section>
    </div>
  );
}

export default function UsuariosPage() {
  const [pagina, setPagina] = useState(0);
  const [data, setData] = useState({ content: [], page: { totalPages: 0, totalElements: 0 } });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");

  const [modalCrear, setModalCrear] = useState(false);
  const [credenciales, setCredenciales] = useState(null); // { username, password, titulo }
  const [editarRol, setEditarRol] = useState(null);
  const [confirmacion, setConfirmacion] = useState(null); // { tipo, usuario }
  const [procesando, setProcesando] = useState(false);
  const [errorConfirm, setErrorConfirm] = useState(null);
  const [aviso, setAviso] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const params = { page: pagina, size: 10 };
      if (filtroRol) params.role = filtroRol;
      if (filtroEstado !== "") params.activo = filtroEstado === "activo";
      setData(await getUsuarios(params));
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setCargando(false);
    }
  }, [pagina, filtroRol, filtroEstado]);

  useEffect(() => { cargar(); }, [cargar]);

  useEffect(() => {
    if (!aviso) return undefined;
    const t = setTimeout(() => setAviso(null), 3500);
    return () => clearTimeout(t);
  }, [aviso]);

  // La búsqueda por texto se hace sobre la página cargada (el backend filtra por rol y estado)
  const visibles = useMemo(() => {
    const q = busqueda.trim().toLocaleLowerCase("es");
    if (!q) return data.content;
    return data.content.filter((u) =>
      `${u.nombre} ${u.apellido} ${u.username} ${u.rut} ${u.email}`.toLocaleLowerCase("es").includes(q));
  }, [data, busqueda]);

  const ejecutarConfirmacion = async () => {
    const { tipo, usuario } = confirmacion;
    setProcesando(true);
    setErrorConfirm(null);
    try {
      if (tipo === "estado") {
        await cambiarEstadoUsuario(usuario.username, { activo: !usuario.activo });
        setAviso(`Cuenta de ${usuario.username} ${usuario.activo ? "desactivada" : "activada"}.`);
      } else if (tipo === "desbloquear") {
        await desbloquearUsuario(usuario.username);
        setAviso(`Cuenta de ${usuario.username} desbloqueada.`);
      } else if (tipo === "reset") {
        const r = await resetPassword(usuario.username);
        setCredenciales({ username: usuario.username, password: r.passwordTemporal, titulo: "Contraseña restablecida" });
      }
      setConfirmacion(null);
      cargar();
    } catch (e) {
      setErrorConfirm(mensajeError(e));
    } finally {
      setProcesando(false);
    }
  };

  const textoConfirmacion = () => {
    if (!confirmacion) return {};
    const { tipo, usuario: u } = confirmacion;
    if (tipo === "estado") {
      return u.activo
        ? { titulo: "Desactivar cuenta", texto: `${u.username} no podrá iniciar sesión. Su historial de acciones se conserva y la cuenta no se elimina.`, confirmar: "Desactivar", peligro: true }
        : { titulo: "Activar cuenta", texto: `${u.username} podrá volver a iniciar sesión.`, confirmar: "Activar", peligro: false };
    }
    if (tipo === "desbloquear") return { titulo: "Desbloquear cuenta", texto: `Se reiniciarán los intentos fallidos de ${u.username}.`, confirmar: "Desbloquear", peligro: false };
    return { titulo: "Restablecer contraseña", texto: `Se generará una contraseña temporal para ${u.username} y deberá cambiarla al ingresar.`, confirmar: "Restablecer", peligro: true };
  };

  const totalPaginas = data.page?.totalPages ?? 0;

  return (
    <AdminLayout title="Gestión de usuarios" subtitle="Solo el Administrador crea, modifica y desactiva cuentas. No existe autorregistro y las cuentas nunca se eliminan.">
      <section className="adm-card">
        <div className="adm-toolbar">
          <div className="adm-filters">
            <input className="adm-input" aria-label="Buscar usuario" placeholder="Buscar nombre, usuario, RUT..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
            <select className="adm-select" aria-label="Filtrar por perfil" value={filtroRol} onChange={(e) => { setPagina(0); setFiltroRol(e.target.value); }}>
              <option value="">Todos los perfiles</option>
              <option value="ADMIN">Administrador</option>
              {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            <select className="adm-select" aria-label="Filtrar por estado" value={filtroEstado} onChange={(e) => { setPagina(0); setFiltroEstado(e.target.value); }}>
              <option value="">Todos los estados</option>
              <option value="activo">Activos</option>
              <option value="inactivo">Desactivados</option>
            </select>
          </div>
          <button className="adm-btn adm-btn-primary" onClick={() => setModalCrear(true)}>＋ Nueva cuenta</button>
        </div>

        {error && <div className="adm-alert" role="alert">{error}</div>}

        <div className="adm-table-scroll">
          <table className="adm-table">
            <thead>
              <tr><th>USUARIO</th><th>NOMBRE</th><th>RUT</th><th>CORREO</th><th>PERFIL</th><th>ESTADO</th><th>ACCIONES</th></tr>
            </thead>
            <tbody>
              {cargando && <tr><td className="adm-empty" colSpan="7">Cargando usuarios...</td></tr>}
              {!cargando && visibles.length === 0 && <tr><td className="adm-empty" colSpan="7">No se encontraron usuarios.</td></tr>}
              {!cargando && visibles.map((u) => {
                const esAdmin = u.role === "ADMIN"; // el backend protege al ADMIN: sin acciones
                return (
                  <tr key={u.id}>
                    <td><strong>{u.username}</strong></td>
                    <td>{u.nombre} {u.apellido}</td>
                    <td>{u.rut}</td>
                    <td>{u.email}</td>
                    <td><span className="adm-pill info">{ROLE_LABEL[u.role] ?? u.role}</span></td>
                    <td>
                      <span className={`adm-pill ${u.activo ? "ok" : "bad"}`}>{u.activo ? "Activo" : "Desactivado"}</span>{" "}
                      {u.bloqueado && <span className="adm-pill warn">Bloqueado</span>}{" "}
                      {u.debeCambiarPassword && <span className="adm-pill warn">Clave temporal</span>}
                    </td>
                    <td>
                      {esAdmin ? <small>Protegido</small> : (
                        <div className="adm-actions">
                          <button className="adm-btn adm-btn-sm" onClick={() => setEditarRol(u)}>Perfil</button>
                          <button className="adm-btn adm-btn-sm" onClick={() => { setErrorConfirm(null); setConfirmacion({ tipo: "reset", usuario: u }); }}>Reset clave</button>
                          {u.bloqueado && <button className="adm-btn adm-btn-sm" onClick={() => { setErrorConfirm(null); setConfirmacion({ tipo: "desbloquear", usuario: u }); }}>Desbloquear</button>}
                          <button className={`adm-btn adm-btn-sm ${u.activo ? "adm-btn-danger" : ""}`} onClick={() => { setErrorConfirm(null); setConfirmacion({ tipo: "estado", usuario: u }); }}>
                            {u.activo ? "Desactivar" : "Activar"}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="adm-pager">
          <span>{data.page?.totalElements ?? 0} usuario(s) · Página {totalPaginas ? pagina + 1 : 0} de {totalPaginas}</span>
          <div>
            <button className="adm-btn adm-btn-sm" disabled={pagina === 0} onClick={() => setPagina((p) => p - 1)}>← Anterior</button>
            <button className="adm-btn adm-btn-sm" disabled={pagina + 1 >= totalPaginas} onClick={() => setPagina((p) => p + 1)}>Siguiente →</button>
          </div>
        </div>
      </section>

      {modalCrear && (
        <CrearUsuarioModal
          onClose={() => setModalCrear(false)}
          onCreado={(creado, passwordTemporal) => {
            setModalCrear(false);
            setCredenciales({ username: creado.username, password: passwordTemporal, titulo: "Cuenta creada" });
            cargar();
          }}
        />
      )}
      {credenciales && <CredencialesModal {...credenciales} onClose={() => setCredenciales(null)} />}
      {editarRol && (
        <CambiarRolModal
          usuario={editarRol}
          onClose={() => setEditarRol(null)}
          onGuardado={(msg) => { setEditarRol(null); setAviso(msg); cargar(); }}
        />
      )}
      {confirmacion && (
        <ConfirmarModal
          {...textoConfirmacion()}
          cargando={procesando}
          error={errorConfirm}
          onCancel={() => setConfirmacion(null)}
          onConfirm={ejecutarConfirmacion}
        />
      )}
      {aviso && <div className="adm-toast" role="status">{aviso}</div>}
    </AdminLayout>
  );
}
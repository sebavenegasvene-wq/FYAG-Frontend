import { useCallback, useEffect, useState } from "react";
import { cambiarEstadoTipoServicio, createTipoServicio, getTiposServicio, updateTipoServicio } from "../api/tiposServicio";
import AppLayout from "../components/AppLayout";
import { Alert, ConfirmModal, DataTable, Field, Modal, Pill, Toast } from "../components/ui";
import { useToast } from "../hooks/useToast";
import { lista } from "../lib/datos";
import { erroresPorCampo, mensajeError } from "../lib/errores";

// HU-08: listas paramétricas editables sin depender de un desarrollador.
export default function TiposServicioPage() {
  const [tipos, setTipos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [edicion, setEdicion] = useState(null); // {} = nuevo, {id,nombre} = editar
  const [nombre, setNombre] = useState("");
  const [errorNombre, setErrorNombre] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [confirmar, setConfirmar] = useState(null);
  const [errorConf, setErrorConf] = useState(null);
  const { aviso, mostrar } = useToast();

  const cargar = useCallback(async () => {
    setCargando(true); setError(null);
    try { setTipos(lista(await getTiposServicio(true))); }
    catch (e) { setError(mensajeError(e, "No se pudieron cargar los tipos de servicio.")); }
    finally { setCargando(false); }
  }, []);
  useEffect(() => { cargar(); }, [cargar]);

  const abrir = (t = {}) => { setEdicion(t); setNombre(t.nombre ?? ""); setErrorNombre(null); };

  const guardar = async (ev) => {
    ev.preventDefault();
    if (!nombre.trim()) return setErrorNombre("El nombre es obligatorio");
    if (nombre.trim().length > 80) return setErrorNombre("Máximo 80 caracteres");
    setGuardando(true); setErrorNombre(null);
    try {
      if (edicion.id) await updateTipoServicio(edicion.id, { nombre: nombre.trim() });
      else await createTipoServicio({ nombre: nombre.trim() });
      mostrar(edicion.id ? "Tipo de servicio actualizado." : "Tipo de servicio creado.");
      setEdicion(null); cargar();
    } catch (e) { setErrorNombre(erroresPorCampo(e).nombre ?? mensajeError(e)); }
    finally { setGuardando(false); }
  };

  const cambiarEstado = async () => {
    setGuardando(true); setErrorConf(null);
    try {
      await cambiarEstadoTipoServicio(confirmar.id, { activo: !confirmar.activo });
      mostrar(`«${confirmar.nombre}» ${confirmar.activo ? "desactivado" : "activado"}.`);
      setConfirmar(null); cargar();
    } catch (e) { setErrorConf(mensajeError(e)); }
    finally { setGuardando(false); }
  };

  const columnas = [
    { label: "Tipo de servicio", render: (t) => <strong>{t.nombre}</strong> },
    { label: "Estado", render: (t) => <Pill tono={t.activo ? "ok" : "bad"}>{t.activo ? "Vigente" : "Desactivado"}</Pill> },
    { label: "Acciones", acciones: true, render: (t) => (
      <>
        <button className="adm-btn adm-btn-sm" onClick={() => abrir(t)}>Editar</button>
        <button className={`adm-btn adm-btn-sm ${t.activo ? "adm-btn-danger" : ""}`} onClick={() => { setErrorConf(null); setConfirmar(t); }}>{t.activo ? "Desactivar" : "Activar"}</button>
      </>
    ) },
  ];

  return (
    <AppLayout title="Tipos de servicio" subtitle="Categorías con las que se clasifican las obras. Los tipos desactivados no aparecen en obras nuevas pero se conservan en las históricas."
      actions={<button className="adm-btn adm-btn-primary" onClick={() => abrir()}>＋ Nuevo tipo</button>}>
      <section className="adm-card">
        <Alert>{error}</Alert>
        <DataTable columnas={columnas} filas={tipos} cargando={cargando} vacio="Aún no hay tipos de servicio. Crea el primero." />
      </section>
      {edicion && (
        <Modal titulo={edicion.id ? "Editar tipo de servicio" : "Nuevo tipo de servicio"} onClose={() => setEdicion(null)} onSubmit={guardar} bloquear={guardando}>
          <Field label="Nombre" name="nombre" error={errorNombre} hint="Ej: Mantención, Climatización, Emergencia">
            <input id="f-nombre" className={`adm-input${errorNombre ? " error" : ""}`} value={nombre} onChange={(e) => { setNombre(e.target.value); setErrorNombre(null); }} maxLength={80} autoComplete="off" />
          </Field>
          <div className="adm-modal-actions">
            <button type="button" className="adm-btn" onClick={() => setEdicion(null)}>Cancelar</button>
            <button type="submit" className="adm-btn adm-btn-primary" disabled={guardando}>{guardando ? "Guardando..." : "Guardar"}</button>
          </div>
        </Modal>
      )}
      {confirmar && (
        <ConfirmModal titulo={confirmar.activo ? "Desactivar tipo de servicio" : "Activar tipo de servicio"}
          texto={confirmar.activo ? `«${confirmar.nombre}» dejará de aparecer en obras nuevas. Las obras existentes lo conservan.` : `«${confirmar.nombre}» volverá a estar disponible para obras nuevas.`}
          confirmar={confirmar.activo ? "Desactivar" : "Activar"} peligro={confirmar.activo} cargando={guardando} error={errorConf} onCancel={() => setConfirmar(null)} onConfirm={cambiarEstado} />
      )}
      <Toast>{aviso}</Toast>
    </AppLayout>
  );
}

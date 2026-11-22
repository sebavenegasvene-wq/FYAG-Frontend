import { useCallback, useEffect, useState } from "react";
import { createCliente, getClientes, updateCliente } from "../../api/clientes";
import AppLayout from "../../components/AppLayout";
import { Alert, DataTable, Field, Modal, Pager, Toast } from "../../components/ui";
import { useForm } from "../../hooks/useForm";
import { useToast } from "../../hooks/useToast";
import { lista, paginaVacia } from "../../lib/datos";
import { erroresPorCampo, mensajeError } from "../../lib/errores";

// CLIENTES: directorio de clientes (solo Finanzas). Un presupuesto siempre se hace sobre un cliente que ya exista.
const VACIO = { rut: "", razonSocial: "", direccion: "", email: "", telefono: "" };

// Validaciones: RUT con formato 76123456-7, razón social obligatoria y correo válido
function validar(f, editando) {
  const e = {};
  if (!editando && !/^\d{7,8}-[\dkK]$/.test(f.rut.trim())) e.rut = "Formato inválido (ej: 76123456-7)";
  if (!f.razonSocial.trim()) e.razonSocial = "La razón social es obligatoria";
  if (f.email.trim() && !/^\S+@\S+\.\S+$/.test(f.email.trim())) e.email = "Correo no válido";
  return e;
}

// Ventana para crear o editar un cliente (el RUT no se puede cambiar al editar)
function ClienteModal({ cliente, onClose, onGuardado }) {
  const { form, errors, setErrors, handleChange } = useForm(cliente ? {
    rut: cliente.rut ?? "", razonSocial: cliente.razonSocial ?? "", direccion: cliente.direccion ?? "", email: cliente.email ?? "", telefono: cliente.telefono ?? "",
  } : VACIO);
  const [guardando, setGuardando] = useState(false);
  const [errorServidor, setErrorServidor] = useState(null);

  // Valida y guarda (crea o actualiza según corresponda)
  const enviar = async (ev) => {
    ev.preventDefault();
    const e = validar(form, !!cliente);
    if (Object.keys(e).length) return setErrors(e);
    setGuardando(true); setErrorServidor(null);
    const payload = { razonSocial: form.razonSocial.trim(), direccion: form.direccion.trim() || null, email: form.email.trim() || null, telefono: form.telefono.trim() || null, ...(cliente ? {} : { rut: form.rut.trim() }) };
    try {
      if (cliente) await updateCliente(cliente.id, payload); else await createCliente(payload);
      onGuardado(cliente ? "Cliente actualizado." : "Cliente registrado.");
    } catch (err) { setErrors(erroresPorCampo(err)); setErrorServidor(mensajeError(err)); }
    finally { setGuardando(false); }
  };

  // Dibuja un campo del formulario
  const campo = (name, label, extra = {}) => (
    <Field label={label} name={name} error={errors[name]} hint={extra.hint} wide={extra.wide}>
      <input id={`f-${name}`} name={name} type={extra.type ?? "text"} className={`adm-input${errors[name] ? " error" : ""}`} value={form[name]} onChange={handleChange} autoComplete="off" />
    </Field>
  );

  return (
    <Modal titulo={cliente ? "Editar cliente" : "Nuevo cliente"} onClose={onClose} onSubmit={enviar} bloquear={guardando}>
      <Alert>{errorServidor}</Alert>
      <div className="adm-form-grid">
        {/* Al editar, el RUT se muestra fijo; al crear, es un campo */}
        {cliente ? (
          <div className="adm-field">
            <label>RUT</label>
            <strong>{cliente.rut}</strong>
            <small className="hint">El RUT no se puede modificar.</small>
          </div>
        ) : campo("rut", "RUT", { hint: "Sin puntos y con guion: 76123456-7" })}
        {/* Resto de los campos */}
        {campo("telefono", "Teléfono (opcional)")}
        {campo("razonSocial", "Razón social", { wide: true })}
        {campo("direccion", "Dirección (opcional)", { wide: true })}
        {campo("email", "Correo de contacto (opcional)", { type: "email", wide: true })}
      </div>
      <div className="adm-modal-actions">
        <button type="button" className="adm-btn" onClick={onClose} disabled={guardando}>Cancelar</button>
        <button type="submit" className="adm-btn adm-btn-primary" disabled={guardando}>{guardando ? "Guardando..." : "Guardar cliente"}</button>
      </div>
    </Modal>
  );
}

// Pantalla con la lista de clientes
export default function ClientesPage() {
  const [pagina, setPagina] = useState(0);
  const [data, setData] = useState(paginaVacia);
  const [busqueda, setBusqueda] = useState("");
  // 'busqueda' es lo que se escribe y 'termino' lo que realmente se consulta (con una pequeña espera)
  const [termino, setTermino] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null); // {} nuevo | cliente
  const { aviso, mostrar } = useToast();

  // Espera 350 ms tras la última tecla antes de buscar, para no consultar en cada letra
  useEffect(() => { const t = setTimeout(() => { setPagina(0); setTermino(busqueda.trim()); }, 350); return () => clearTimeout(t); }, [busqueda]);

  // Pide los clientes al backend (10 por página, con búsqueda por RUT o razón social)
  const cargar = useCallback(async () => {
    setCargando(true); setError(null);
    try {
      const params = { page: pagina, size: 10 };
      if (termino) params.busqueda = termino;
      const r = await getClientes(params);
      setData(Array.isArray(r) ? { content: r, page: { totalPages: 1, totalElements: r.length } } : r);
    } catch (e) { setError(mensajeError(e, "No se pudieron cargar los clientes.")); }
    finally { setCargando(false); }
  }, [pagina, termino]);
  useEffect(() => { cargar(); }, [cargar]);

  // Columnas de la tabla
  const columnas = [
    { label: "RUT", render: (c) => c.rut },
    { label: "Razón social", render: (c) => <strong>{c.razonSocial}</strong> },
    { label: "Correo", render: (c) => c.email ?? "—" },
    { label: "Teléfono", render: (c) => c.telefono ?? "—" },
    { label: "Dirección", render: (c) => c.direccion ?? "—" },
    { label: "Acciones", acciones: true, render: (c) => <button className="adm-btn adm-btn-sm" onClick={() => setModal(c)}>Editar</button> },
  ];

  return (
    <AppLayout title="Clientes" subtitle="Directorio de clientes. Los presupuestos se registran siempre sobre un cliente existente."
      actions={<button className="adm-btn adm-btn-primary" onClick={() => setModal({})}>＋ Nuevo cliente</button>}>
      {/* Buscador, tabla y paginación */}
      <section className="adm-card">
        <div className="adm-toolbar">
          <div className="adm-filters">
            <input className="adm-input" aria-label="Buscar cliente" placeholder="Buscar por RUT o razón social..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
          </div>
        </div>
        <Alert>{error}</Alert>
        <DataTable columnas={columnas} filas={lista(data)} cargando={cargando} vacio="No se encontraron clientes." />
        <Pager data={data} pagina={pagina} setPagina={setPagina} unidad="cliente(s)" />
      </section>
      {/* Ventana de crear/editar */}
      {modal && <ClienteModal cliente={modal.id ? modal : null} onClose={() => setModal(null)} onGuardado={(m) => { setModal(null); mostrar(m); cargar(); }} />}
      <Toast>{aviso}</Toast>
    </AppLayout>
  );
}
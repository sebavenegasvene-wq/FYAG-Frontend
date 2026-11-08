import { useCallback, useEffect, useState } from "react";
import { createCliente, getClientes, updateCliente } from "../../api/clientes";
import AppLayout from "../../components/AppLayout";
import { Alert, DataTable, Field, Modal, Pager, Toast } from "../../components/ui";
import { useForm } from "../../hooks/useForm";
import { useToast } from "../../hooks/useToast";
import { lista, paginaVacia } from "../../lib/datos";
import { erroresPorCampo, mensajeError } from "../../lib/errores";

const VACIO = { rut: "", razonSocial: "", direccion: "", email: "", telefono: "" };

function validar(f) {
  const e = {};
  if (!/^\d{7,8}-[\dkK]$/.test(f.rut.trim())) e.rut = "Formato inválido (ej: 76123456-7)";
  if (!f.razonSocial.trim()) e.razonSocial = "La razón social es obligatoria";
  if (f.email.trim() && !/^\S+@\S+\.\S+$/.test(f.email.trim())) e.email = "Correo no válido";
  return e;
}

function ClienteModal({ cliente, onClose, onGuardado }) {
  const { form, errors, setErrors, handleChange } = useForm(cliente ? {
    rut: cliente.rut ?? "", razonSocial: cliente.razonSocial ?? "", direccion: cliente.direccion ?? "", email: cliente.email ?? "", telefono: cliente.telefono ?? "",
  } : VACIO);
  const [guardando, setGuardando] = useState(false);
  const [errorServidor, setErrorServidor] = useState(null);

  const enviar = async (ev) => {
    ev.preventDefault();
    const e = validar(form);
    if (Object.keys(e).length) return setErrors(e);
    setGuardando(true); setErrorServidor(null);
    const payload = { rut: form.rut.trim(), razonSocial: form.razonSocial.trim(), direccion: form.direccion.trim() || null, email: form.email.trim() || null, telefono: form.telefono.trim() || null };
    try {
      if (cliente) await updateCliente(cliente.id, payload); else await createCliente(payload);
      onGuardado(cliente ? "Cliente actualizado." : "Cliente registrado.");
    } catch (err) { setErrors(erroresPorCampo(err)); setErrorServidor(mensajeError(err)); }
    finally { setGuardando(false); }
  };

  const campo = (name, label, extra = {}) => (
    <Field label={label} name={name} error={errors[name]} hint={extra.hint} wide={extra.wide}>
      <input id={`f-${name}`} name={name} type={extra.type ?? "text"} className={`adm-input${errors[name] ? " error" : ""}`} value={form[name]} onChange={handleChange} autoComplete="off" />
    </Field>
  );

  return (
    <Modal titulo={cliente ? "Editar cliente" : "Nuevo cliente"} onClose={onClose} onSubmit={enviar} bloquear={guardando}>
      <Alert>{errorServidor}</Alert>
      <div className="adm-form-grid">
        {campo("rut", "RUT", { hint: "Sin puntos y con guion: 76123456-7" })}
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

export default function ClientesPage() {
  const [pagina, setPagina] = useState(0);
  const [data, setData] = useState(paginaVacia);
  const [busqueda, setBusqueda] = useState("");
  const [termino, setTermino] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null); // {} nuevo | cliente
  const { aviso, mostrar } = useToast();

  useEffect(() => { const t = setTimeout(() => { setPagina(0); setTermino(busqueda.trim()); }, 350); return () => clearTimeout(t); }, [busqueda]);

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
      {modal && <ClienteModal cliente={modal.id ? modal : null} onClose={() => setModal(null)} onGuardado={(m) => { setModal(null); mostrar(m); cargar(); }} />}
      <Toast>{aviso}</Toast>
    </AppLayout>
  );
}

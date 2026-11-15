import { useEffect, useState } from "react";
import { cambiarEstadoObra, getRentabilidad } from "../../api/obras";
import CostosForm from "../../components/CostosForm";
import { Alert, ConfirmModal, EstadoPill, Modal } from "../../components/ui";
import { mensajeError } from "../../lib/errores";
import { clp, fecha, humanizar } from "../../lib/format";
import { ESTADO_OBRA } from "../../lib/roles";

// Transiciones válidas según la máquina de estados (HU-09)
const TRANSICIONES = { EN_PROCESO: ["FINALIZADA", "SUSPENDIDA", "CANCELADA"], SUSPENDIDA: ["EN_PROCESO", "CANCELADA"], FINALIZADA: [], CANCELADA: [] };

// Hallazgo UX 2: el botón dice a qué estado pasa la obra y se pide confirmación antes de cambiar.
const textoBoton = (actual, destino) => (actual === "SUSPENDIDA" && destino === "EN_PROCESO" ? "Reanudar obra" : `Pasar a ${ESTADO_OBRA[destino].label}`);
const ADVERTENCIA = {
  FINALIZADA: "Se revisará que la obra tenga técnico asignado y costos reales (materiales y horas). Si falta algo, el sistema no la finalizará.",
  SUSPENDIDA: "La obra quedará pausada. Debes indicar el motivo; quedará en el historial.",
  CANCELADA: "No se puede cancelar una obra que tenga pagos asociados. Esta acción no se puede deshacer.",
  EN_PROCESO: "La obra volverá a estar en ejecución.",
};

const formatoRentab = (clave, valor) => {
  if (typeof valor !== "number") return String(valor);
  if (/porcent|margen/i.test(clave)) return `${valor.toLocaleString("es-CL", { maximumFractionDigits: 1 })} %`;
  if (/hora/i.test(clave)) return valor.toLocaleString("es-CL");
  return clp(valor);
};

function Rentabilidad({ obraId }) {
  const [datos, setDatos] = useState(undefined);
  useEffect(() => {
    let activo = true;
    getRentabilidad(obraId).then((d) => activo && setDatos(d)).catch(() => activo && setDatos(null));
    return () => { activo = false; };
  }, [obraId]);
  if (datos === undefined) return <p className="adm-sub">Calculando rentabilidad...</p>;
  const filas = datos ? Object.entries(datos).filter(([k, v]) => typeof v === "number" && !/^id$|obraId/i.test(k)) : [];
  if (!filas.length) return <p className="adm-sub">Aún no hay costos registrados para calcular la rentabilidad.</p>;
  return (
    <div className="adm-detail">
      {filas.map(([k, v]) => <div key={k}><h3>{humanizar(k).toUpperCase()}</h3><p>{formatoRentab(k, v)}</p></div>)}
    </div>
  );
}

export default function FichaObra({ obra, rol, onClose, onCambio }) {
  const esSupervisor = rol === "SUPERVISOR";
  const verRentabilidad = rol === "GERENCIA" || rol === "FINANZAS";
  const [pendiente, setPendiente] = useState(null); // estado destino a confirmar
  const [motivo, setMotivo] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState(null);
  const [verCostos, setVerCostos] = useState(false);
  const [okCostos, setOkCostos] = useState(false);

  const confirmar = async () => {
    if (pendiente === "SUSPENDIDA" && !motivo.trim()) return setError("El motivo de la suspensión es obligatorio.");
    setProcesando(true); setError(null);
    try {
      await cambiarEstadoObra(obra.id, { estado: pendiente, motivo: motivo.trim() || null });
      onCambio(`Obra «${obra.nombre}» ahora está ${ESTADO_OBRA[pendiente].label.toLowerCase()}.`);
    } catch (e) { setError(mensajeError(e)); }
    finally { setProcesando(false); }
  };

  if (pendiente) {
    return (
      <ConfirmModal titulo={textoBoton(obra.estado, pendiente)} texto={ADVERTENCIA[pendiente]} confirmar="Sí, confirmar" peligro={pendiente === "CANCELADA"}
        cargando={procesando} error={error} onCancel={() => { setPendiente(null); setMotivo(""); setError(null); }} onConfirm={confirmar}>
        {pendiente === "SUSPENDIDA" && (
          <div className="adm-field">
            <label htmlFor="f-motivo">Motivo de la suspensión</label>
            <textarea id="f-motivo" className="adm-textarea" maxLength={500} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ej: Falta de materiales" />
          </div>
        )}
      </ConfirmModal>
    );
  }

  const destinos = esSupervisor ? TRANSICIONES[obra.estado] ?? [] : [];
  return (
    <Modal titulo={obra.nombre} descripcion={`${obra.clienteRazonSocial ?? ""}`} onClose={onClose} ancho="wide">
      <p style={{ marginTop: -8 }}><EstadoPill mapa={ESTADO_OBRA} valor={obra.estado} /></p>
      {okCostos && <Alert tipo="ok">Costos guardados.</Alert>}
      <div className="adm-detail">
        <div><h3>TIPO DE SERVICIO</h3><p>{obra.tipoServicioNombre ?? "—"}</p></div>
        <div><h3>TÉCNICO ASIGNADO</h3><p>{obra.tecnicoNombre ?? "Sin asignar"}</p></div>
        <div><h3>FECHA DE INICIO</h3><p>{fecha(obra.fechaInicio)}</p></div>
        <div><h3>FECHA DE TÉRMINO</h3><p>{fecha(obra.fechaTermino)}</p></div>
        <div className="wide"><h3>DESCRIPCIÓN</h3><p>{obra.descripcion || "Sin descripción."}</p></div>
        {obra.motivoSuspension && <div className="wide"><h3>MOTIVO DE SUSPENSIÓN</h3><p>{obra.motivoSuspension}</p></div>}
      </div>

      {verRentabilidad && <><h3 className="adm-section">Rentabilidad real</h3><Rentabilidad obraId={obra.id} /></>}

      {esSupervisor && obra.estado !== "CANCELADA" && (
        <>
          <h3 className="adm-section">Costos reales</h3>
          {verCostos
            ? <CostosForm obraId={obra.id} onCancel={() => setVerCostos(false)} onGuardado={() => { setVerCostos(false); setOkCostos(true); }} />
            : <button className="adm-btn" onClick={() => { setOkCostos(false); setVerCostos(true); }}>Registrar o revisar costos</button>}
        </>
      )}

      {destinos.length > 0 && !verCostos && (
        <>
          <hr className="adm-sep" />
          <div className="adm-actions">
            {destinos.map((d) => (
              <button key={d} className={`adm-btn ${d === "CANCELADA" ? "adm-btn-danger" : d === "FINALIZADA" ? "adm-btn-primary" : ""}`} onClick={() => setPendiente(d)}>{textoBoton(obra.estado, d)}</button>
            ))}
          </div>
        </>
      )}
      <div className="adm-modal-actions"><button className="adm-btn" onClick={onClose}>Cerrar</button></div>
    </Modal>
  );
}

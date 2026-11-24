import { Link } from "react-router-dom";
import { getRole } from "../api/auth";
import AppLayout from "../components/AppLayout";
import { MODULOS, ROLE_LABEL } from "../lib/roles";

// Panel de inicio común: las tarjetas se arman según el perfil (RBAC, mínimo privilegio).
// INICIO: muestra tarjetas con los módulos que el rol del usuario puede usar (ver MODULOS en lib/roles.js).
export default function InicioPage() {
  const role = getRole();
  const username = localStorage.getItem("username");
  // Tarjetas del rol actual
  const modulos = MODULOS[role] ?? [];

  return (
    <AppLayout title={`Panel de ${ROLE_LABEL[role] ?? "Inicio"}`} subtitle={`Hola, ${username}. Elige un módulo para comenzar.`}>
      <section className="adm-modules" aria-label="Módulos">
        {/* Cada tarjeta es un enlace al módulo */}
        {modulos.map((m) => (
          <Link key={m.to} to={m.to} className={`adm-module ${m.color}`}>
            <span className="adm-module-icon" aria-hidden="true">{m.icono}</span>
            <strong>{m.titulo}</strong>
            <small>{m.texto}</small>
            <span className="adm-module-go">Abrir →</span>
          </Link>
        ))}
      </section>
    </AppLayout>
  );
}

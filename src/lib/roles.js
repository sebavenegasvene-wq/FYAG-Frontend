export const ROLE_LABEL = {
  ADMIN: "Administrador",
  GERENCIA: "Gerencia",
  FINANZAS: "Finanzas",
  SUPERVISOR: "Supervisor de Obras",
  TECNICO: "Técnico",
};

// Menú por perfil: cada usuario ve solo los módulos que le corresponden (RBAC, mínimo privilegio).
// El backend igualmente valida con @PreAuthorize.
export const NAV = {
  ADMIN: [
    { to: "/admin", label: "Inicio", end: true },
    { to: "/admin/dashboard", label: "Dashboard" },
    { to: "/admin/obras", label: "Obras" },
    { to: "/admin/usuarios", label: "Usuarios" },
  ],
  GERENCIA: [
    { to: "/gerencia", label: "Dashboard" },
    { to: "/presupuestos", label: "Presupuestos" },
    { to: "/obras", label: "Obras" },
    { to: "/cobranzas", label: "Cobranzas" },
    { to: "/reportes", label: "Reportes" },
  ],
  FINANZAS: [
    { to: "/finanzas", label: "Dashboard" },
    { to: "/clientes", label: "Clientes" },
    { to: "/presupuestos", label: "Presupuestos" },
    { to: "/obras", label: "Obras" },
    { to: "/cobranzas", label: "Cobranzas" },
    { to: "/reportes", label: "Reportes" },
  ],
  SUPERVISOR: [
    { to: "/supervisor", label: "Obras" },
    { to: "/tipos-servicio", label: "Tipos de servicio" },
  ],
  TECNICO: [{ to: "/tecnico", label: "Mis obras" }],
};

// Colores estandarizados (HU-17): verde = pagado/finalizado, rojo = pendiente/cancelado/emergencia
export const ESTADO_OBRA = {
  EN_PROCESO: { label: "En proceso", tono: "info" },
  FINALIZADA: { label: "Finalizada", tono: "ok" },
  SUSPENDIDA: { label: "Suspendida", tono: "warn" },
  CANCELADA: { label: "Cancelada", tono: "bad" },
};
export const ESTADO_PRESUPUESTO = {
  PENDIENTE: { label: "Pendiente", tono: "bad" },
  APROBADO: { label: "Aprobado", tono: "ok" },
  RECHAZADO: { label: "Rechazado", tono: "warn" },
};
export const ESTADO_PAGO = {
  PENDIENTE: { label: "Pendiente", tono: "bad" },
  PAGADO: { label: "Pagado", tono: "ok" },
};

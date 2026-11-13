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
    { to: "/inicio", label: "Inicio", end: true },
    { to: "/admin/dashboard", label: "Dashboard" },
    { to: "/admin/obras", label: "Obras" },
    { to: "/admin/usuarios", label: "Usuarios" },
  ],
  GERENCIA: [
    { to: "/inicio", label: "Inicio", end: true },
    { to: "/gerencia", label: "Dashboard" },
    { to: "/presupuestos", label: "Presupuestos" },
    { to: "/obras", label: "Obras" },
    { to: "/cobranzas", label: "Cobranzas" },
    { to: "/reportes", label: "Reportes" },
  ],
  FINANZAS: [
    { to: "/inicio", label: "Inicio", end: true },
    { to: "/finanzas", label: "Dashboard" },
    { to: "/clientes", label: "Clientes" },
    { to: "/presupuestos", label: "Presupuestos" },
    { to: "/obras", label: "Obras" },
    { to: "/cobranzas", label: "Cobranzas" },
    { to: "/reportes", label: "Reportes" },
  ],
  SUPERVISOR: [
    { to: "/inicio", label: "Inicio", end: true },
    { to: "/supervisor", label: "Obras" },
    { to: "/tipos-servicio", label: "Tipos de servicio" },
  ],
  TECNICO: [
    { to: "/inicio", label: "Inicio", end: true },
    { to: "/tecnico", label: "Mis obras" },
  ],
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

// Pantalla de obras de cada perfil (destino de las notificaciones)
export const RUTA_OBRAS = {
  ADMIN: "/admin/obras",
  GERENCIA: "/obras",
  FINANZAS: "/obras",
  SUPERVISOR: "/supervisor",
  TECNICO: "/tecnico",
};


// Tarjetas del panel de Inicio: cada perfil ve solo sus módulos.
const PERFIL = { to: "/perfil", icono: "👤", titulo: "Mi perfil", texto: "Revisa los datos de tu cuenta, edítalos o cambia tu contraseña.", color: "bad" };
export const MODULOS = {
  ADMIN: [
    { to: "/admin/dashboard", icono: "📊", titulo: "Dashboard", texto: "Ventas del mes, presupuestos, obras en proceso y cuentas por cobrar, más el resumen operativo.", color: "info" },
    { to: "/admin/obras", icono: "🏗️", titulo: "Obras", texto: "Revisa el estado, el técnico y las fechas de cada obra (solo lectura, sin montos).", color: "warn" },
    { to: "/admin/usuarios", icono: "👥", titulo: "Usuarios", texto: "Crea cuentas, asigna perfiles, desactiva empleados, resetea claves y desbloquea accesos.", color: "ok" },
    PERFIL,
  ],
  GERENCIA: [
    { to: "/gerencia", icono: "📊", titulo: "Dashboard", texto: "Ventas del mes, presupuestos, obras en proceso y cuentas por cobrar en un vistazo.", color: "info" },
    { to: "/presupuestos", icono: "📝", titulo: "Presupuestos", texto: "Revisa todos los presupuestos y aprueba o rechaza los de alto valor.", color: "warn" },
    { to: "/obras", icono: "🏗️", titulo: "Obras", texto: "Consulta el estado de cada obra y su rentabilidad real.", color: "ok" },
    { to: "/cobranzas", icono: "💰", titulo: "Cobranzas", texto: "Facturas, pagos y clientes con deuda para priorizar el cobro.", color: "bad" },
    { to: "/reportes", icono: "📄", titulo: "Reportes", texto: "Exporta obras y cobranzas a PDF o Excel, incluido el reporte por técnico.", color: "info" },
    PERFIL,
  ],
  FINANZAS: [
    { to: "/finanzas", icono: "📊", titulo: "Dashboard", texto: "Ventas del mes, presupuestos, obras en proceso y cuentas por cobrar en un vistazo.", color: "info" },
    { to: "/clientes", icono: "🏢", titulo: "Clientes", texto: "Registra y busca clientes por RUT o razón social.", color: "ok" },
    { to: "/presupuestos", icono: "📝", titulo: "Presupuestos", texto: "Crea cotizaciones, apruébalas y descarga el PDF institucional.", color: "warn" },
    { to: "/obras", icono: "🏗️", titulo: "Obras", texto: "Consulta el estado de las obras y cuáles están listas para facturar.", color: "ok" },
    { to: "/cobranzas", icono: "💰", titulo: "Cobranzas", texto: "Emite facturas, registra pagos y corrige errores sin borrar historial.", color: "bad" },
    { to: "/reportes", icono: "📄", titulo: "Reportes", texto: "Exporta obras y cobranzas a PDF o Excel con filtros por fecha, cliente y estado.", color: "info" },
    PERFIL,
  ],
  SUPERVISOR: [
    { to: "/supervisor", icono: "🏗️", titulo: "Obras", texto: "Crea obras desde presupuestos aprobados, asigna técnicos y controla su estado.", color: "warn" },
    { to: "/tipos-servicio", icono: "🏷️", titulo: "Tipos de servicio", texto: "Mantén la lista de tipos de servicio sin depender de un desarrollador.", color: "ok" },
    PERFIL,
  ],
  TECNICO: [
    { to: "/tecnico", icono: "🛠️", titulo: "Mis obras", texto: "Consulta tus obras asignadas y registra horas y materiales.", color: "warn" },
    PERFIL,
  ],
};

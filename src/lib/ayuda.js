// Ayuda contextual (HU-28 / RNF-03), personalizada por rol.
// Cada pantalla tiene un contenido base; `roles` lo sobrescribe campo a campo para ese perfil.
// Campos: titulo, texto, pasos[], limites[] (lo que no puede hacer), depende[] (qué debe hacer otro perfil antes).
export const AYUDA = {
  "/inicio": {
    titulo: "Inicio",
    texto: "Tu panel de entrada al sistema.",
    pasos: ["Cada tarjeta es un módulo disponible para tu perfil.", "Pulsa una tarjeta o usa el menú superior para entrar.", "Para volver aquí, pulsa Inicio en el menú o el logo FYAG."],
    roles: {
      ADMIN: { texto: "Eres Administrador: gestionas las cuentas y consultas obras y auditoría en solo lectura.", limites: ["No ves montos financieros ni apruebas presupuestos."] },
      GERENCIA: { texto: "Eres Gerencia: ves todo el negocio y decides los presupuestos de alto valor.", limites: ["Las obras y usuarios son de solo lectura para ti."] },
      FINANZAS: { texto: "Eres Finanzas: llevas clientes, presupuestos, facturas y pagos.", limites: ["Las obras son de solo lectura: el Supervisor es quien las crea y cambia de estado."] },
      SUPERVISOR: { texto: "Eres Supervisor: creas obras, asignas técnicos y controlas su estado.", limites: ["No tienes acceso a facturas ni pagos."] },
      TECNICO: { texto: "Eres Técnico: ves tus obras asignadas y registras horas y materiales.", limites: ["No ves información financiera."] },
    },
  },

  "/admin/dashboard": {
    titulo: "Dashboard del Administrador",
    texto: "Resumen operativo del sistema.",
    pasos: ["Las cifras se actualizan al cargar la pantalla.", "Pulsa Actualizar para volver a consultarlas."],
    limites: ["Las cifras financieras aparecen bloqueadas para tu perfil."],
  },
  "/admin/obras": {
    titulo: "Obras (solo lectura)",
    texto: "Consulta el estado de las obras para dar soporte.",
    pasos: ["Filtra por estado o escribe en el buscador.", "Pulsa Ver ficha para abrir el detalle."],
    limites: ["No puedes modificar obras ni ver montos."],
    depende: ["Las obras las crea y cambia de estado el Supervisor."],
  },
  "/admin/usuarios": {
    titulo: "Gestión de usuarios",
    texto: "Solo el Administrador crea y administra las cuentas.",
    pasos: ["Pulsa Nueva cuenta, completa los datos y genera una contraseña temporal.", "Entrega la contraseña al empleado: se muestra una sola vez.", "Si una cuenta quedó bloqueada por intentos fallidos, usa Desbloquear.", "Para dar de baja a un empleado, usa Desactivar."],
    limites: ["Las cuentas no se eliminan: al desactivar se bloquea el ingreso pero se conserva el historial.", "No existe autorregistro: nadie puede crearse una cuenta solo."],
    depende: ["El empleado debe cambiar la contraseña temporal en su primer inicio de sesión."],
  },

  "/gerencia": {
    titulo: "Dashboard gerencial",
    texto: "Los indicadores del negocio, sin armar reportes.",
    pasos: ["Arriba ves ventas del mes, presupuestos, obras en proceso y cuentas por cobrar.", "Verde indica pagado o finalizado; rojo indica pendiente.", "Pulsa Actualizar para recargar los datos."],
    depende: ["Los indicadores se llenan con lo que registran Finanzas (presupuestos y facturas) y el Supervisor (obras)."],
  },
  "/finanzas": {
    titulo: "Dashboard de Finanzas",
    texto: "Indicadores financieros y de cobranza.",
    pasos: ["Revisa las cuentas por cobrar y los presupuestos pendientes.", "Usa el menú para registrar presupuestos, facturas y pagos.", "Verde indica pagado o finalizado; rojo indica pendiente."],
    depende: ["Las obras en proceso y finalizadas las actualiza el Supervisor."],
  },

  "/presupuestos": {
    titulo: "Presupuestos",
    texto: "Cotizaciones de FYAG.",
    pasos: ["Un presupuesto nuevo siempre queda Pendiente.", "Al aprobar se genera el PDF institucional."],
    roles: {
      FINANZAS: {
        texto: "Aquí registras y apruebas cotizaciones.",
        pasos: ["Pulsa Nuevo presupuesto, busca al cliente por RUT o razón social y agrega al menos un ítem.", "Si el monto no supera el umbral, puedes aprobarlo tú: se genera el PDF institucional.", "Para rechazar debes escribir el motivo."],
        limites: ["Si el monto supera el umbral, solo Gerencia puede aprobarlo o rechazarlo.", "Un presupuesto aprobado ya no se puede modificar."],
        depende: ["La obra solo la puede crear el Supervisor, y únicamente desde un presupuesto aprobado."],
      },
      GERENCIA: {
        texto: "Aquí revisas los presupuestos y decides los de alto valor.",
        pasos: ["Revisa los presupuestos y sus montos.", "Aprueba o rechaza los que superan el umbral. Al rechazar debes escribir el motivo.", "Al aprobar se genera el PDF institucional."],
        limites: ["No creas ni editas presupuestos: eso lo hace Finanzas."],
        depende: ["Finanzas registra el presupuesto primero; tú intervienes cuando supera el umbral."],
      },
    },
  },
  "/clientes": {
    titulo: "Clientes",
    texto: "Directorio de clientes de FYAG.",
    pasos: ["Busca por RUT o razón social.", "Pulsa Nuevo cliente para registrar uno.", "Usa Editar para corregir los datos de contacto."],
    limites: ["El RUT de un cliente no se puede cambiar."],
    depende: ["Para hacer un presupuesto, el cliente debe estar registrado aquí primero."],
  },

  "/obras": {
    titulo: "Obras",
    texto: "Seguimiento de obras (solo consulta).",
    pasos: ["Filtra por estado o busca por cliente.", "Pulsa Ver ficha para ver el detalle."],
    roles: {
      FINANZAS: {
        texto: "Consulta el estado de las obras y cuáles están listas para facturar.",
        limites: ["No cambias estados ni asignas técnicos: eso lo hace el Supervisor."],
        depende: ["Solo puedes facturar una obra cuando el Supervisor la deja Finalizada (con técnico y costos registrados)."],
      },
      GERENCIA: {
        texto: "Consulta el estado de cada obra y su rentabilidad real.",
        pasos: ["Filtra por estado o busca por cliente.", "Pulsa Ver ficha para ver el detalle y la rentabilidad real (presupuesto frente a costo real)."],
        limites: ["Es solo lectura: no editas obras."],
        depende: ["La rentabilidad aparece cuando se registraron los costos de la obra (materiales y horas técnicas)."],
      },
    },
  },
  "/supervisor": {
    titulo: "Gestión de obras",
    texto: "Tú creas las obras y controlas su ciclo de vida.",
    pasos: ["Pulsa Nueva obra y elige un presupuesto aprobado de la lista.", "Abre la ficha para cambiar el estado con el botón Pasar a…; el sistema pide confirmación.", "Para suspender debes escribir el motivo."],
    limites: ["No puedes finalizar una obra sin técnico asignado ni costos registrados.", "No puedes cancelar una obra que ya tiene pagos asociados.", "No ves montos ni facturas."],
    depende: ["Solo aparecen presupuestos aprobados: si falta uno, Finanzas (o Gerencia, si es de alto valor) debe aprobarlo primero.", "Los costos de horas y materiales los registra el Técnico; hasta que estén, no podrás finalizar.", "Finanzas espera que dejes la obra Finalizada para poder facturarla."],
  },
  "/tipos-servicio": {
    titulo: "Tipos de servicio",
    texto: "Lista editable de categorías de obra. Solo el Supervisor la modifica.",
    pasos: ["Pulsa Nuevo tipo para agregar una categoría.", "Usa Editar para cambiar el nombre."],
    limites: ["Desactivar un tipo lo oculta en obras nuevas, pero se conserva en las obras históricas."],
  },
  "/tecnico": {
    titulo: "Mis obras",
    texto: "Aquí ves solo las obras que te asignaron.",
    pasos: ["Toca el filtro para ver tus obras por estado.", "Pulsa Registrar horas y materiales en la obra que trabajaste.", "Guarda al terminar."],
    limites: ["Solo ves tus obras asignadas.", "No ves montos ni información financiera.", "No cambias el estado de la obra: lo hace el Supervisor."],
    depende: ["Si no ves una obra, el Supervisor debe asignártela.", "La obra no se puede finalizar hasta que registres las horas y los materiales."],
  },

  "/cobranzas": {
    titulo: "Cobranzas",
    texto: "Facturas, pagos y clientes con deuda.",
    pasos: ["En Clientes con pagos pendientes ves el monto adeudado y los días de atraso."],
    roles: {
      FINANZAS: {
        texto: "Aquí emites facturas, registras pagos y corrigés errores sin borrar historial.",
        pasos: ["En Facturas, emite una factura sobre una obra finalizada.", "Pulsa Registrar pago cuando el cliente pague.", "Si registraste un pago por error, usa Anular pago: la factura vuelve a Pendiente y queda el historial.", "En Clientes con pagos pendientes ves el monto adeudado y los días de atraso."],
        limites: ["Solo se factura una obra Finalizada.", "La fecha de pago no puede ser anterior a la de emisión.", "Una factura pagada no se puede pagar dos veces.", "Ninguna factura se elimina: los errores se corrigen anulando el pago."],
        depende: ["Para poder facturar, el Supervisor debe haber finalizado la obra."],
      },
      GERENCIA: {
        texto: "Consulta el estado de cobro para priorizar acciones.",
        pasos: ["Revisa las facturas y su estado de pago.", "En Clientes con pagos pendientes ves el monto adeudado y los días de atraso para decidir a quién cobrar primero."],
        limites: ["Es solo consulta: emitir facturas, registrar pagos y anularlos lo hace Finanzas."],
        depende: ["Las facturas existen cuando Finanzas las emite, y solo sobre obras que el Supervisor ya finalizó."],
      },
    },
  },
  "/reportes": {
    titulo: "Reportes",
    texto: "Exporta información a PDF o Excel.",
    pasos: ["Descargas rápidas: un clic baja el PDF de obras o cobranzas del mes actual o del anterior.", "Para algo distinto, elige el tipo de reporte y el formato.", "Aplica filtros por fecha, estado, técnico o cliente.", "Abajo, la vista previa lista lo que entrará al archivo y se actualiza con cada filtro.", "Pulsa Descargar: el archivo solo incluye lo que filtraste."],
    roles: {
      FINANZAS: { texto: "Exporta obras y cobranzas para compartir con Gerencia o auditoría.", depende: ["Los reportes de cobranza muestran las facturas ya emitidas por ti."] },
      GERENCIA: { texto: "Exporta información para evaluar el negocio y a tu equipo.", pasos: ["Elige el tipo de reporte y el formato (PDF o Excel).", "Usa el filtro por técnico para evaluar la carga y el estado de sus obras.", "Pulsa Descargar: el archivo solo incluye lo que filtraste."] },
    },
  },

  "/auditoria": {
    titulo: "Auditoría",
    texto: "Historial de quién hizo qué y cuándo. Solo Administrador y Gerencia pueden verlo.",
    pasos: ["Elige Todos los registros, Por usuario o Por fecha.", "En Por usuario selecciona a la persona; en Por fecha define desde y hasta (el día final se incluye).", "Cada fila muestra quién, cuándo, la acción y los valores que cambiaron."],
    limites: ["Es solo lectura: los registros no se pueden editar ni eliminar."],
  },

  "/perfil": {
    titulo: "Mi perfil",
    texto: "Los datos de tu cuenta y tu contraseña.",
    pasos: ["Arriba ves tus datos. Pulsa Editar datos para cambiar nombre, correo o teléfono.", "Abajo puedes cambiar tu contraseña: escribe la actual y define una nueva de 8 a 72 caracteres."],
    limites: ["Tu usuario, RUT y perfil los define el Administrador y no se pueden editar aquí."],
  },
  "/cambiar-password": {
    titulo: "Cambiar contraseña",
    texto: "Actualiza tu clave de acceso.",
    pasos: ["Escribe tu contraseña actual.", "Elige una nueva de 8 a 72 caracteres, distinta a la actual.", "Confírmala y pulsa Cambiar contraseña."],
  },
};

// Une el contenido base con la versión del rol (si existe)
export const ayudaPara = (ruta, role) => {
  const base = AYUDA[ruta];
  if (!base) return null;
  const { roles, ...resto } = base;
  return { ...resto, ...(roles?.[role] ?? {}) };
};
// Mensajes cortos que aparecen sobre cada botón cuando se abre la ayuda.
// La clave es el texto (o aria-label) del botón, en minúsculas y sin tildes.
// Deja el texto en minúsculas, sin tildes ni símbolos, para buscarlo en el diccionario
export const clave = (s) =>
  (s ?? "").toLocaleLowerCase("es").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9ñ ]/g, " ").replace(/\s+/g, " ").trim();

// DICCIONARIO: texto del botón → mensaje que se muestra sobre él cuando se abre la ayuda
const BOTONES = {
  // Menú superior
  "ir al inicio": "Te lleva de vuelta a la pantalla principal, donde están todas tus opciones.",
  inicio: "Tu pantalla principal. Desde aquí puedes entrar a todo lo que tu perfil permite.",
  dashboard: "Un resumen con los números importantes del negocio: ventas, obras en proceso y cuentas por cobrar.",
  obras: "Lista de las obras (trabajos) de la empresa. Puedes ver en qué estado está cada una.",
  "mis obras": "Aquí aparecen solo las obras que te asignaron. Entra para anotar tus horas y materiales.",
  usuarios: "Aquí se crean las cuentas de los empleados, se les asigna un perfil y se desactivan cuando se van.",
  auditoria: "Historial de todo lo que se ha hecho en el sistema: quién lo hizo, cuándo y qué cambió.",
  "mi perfil": "Tus datos personales. Desde aquí puedes corregir tu correo o teléfono y cambiar tu contraseña.",
  presupuestos: "Las cotizaciones que se envían a los clientes. Se crean, se aprueban o se rechazan aquí.",
  cobranzas: "Facturas emitidas, pagos recibidos y clientes que todavía deben dinero.",
  reportes: "Para descargar informes de obras y cobranzas en PDF o Excel, con los filtros que elijas.",
  clientes: "Lista de los clientes de la empresa. Un cliente debe estar aquí antes de hacerle un presupuesto.",
  "tipos de servicio": "Las categorías de trabajo (por ejemplo, Mantención o Instalación). Puedes agregar o editar.",
  // Barra de herramientas
  "tamano y grosor de letra": "Si te cuesta leer, pulsa aquí para hacer las letras más grandes o más gruesas.",
  "cambiar paleta de colores": "Cambia los colores de todo el sistema. Elige el que sea más cómodo para tus ojos.",
  "cambiar a modo claro": "Cambia el fondo oscuro por uno claro. Útil si estás al aire libre o con mucha luz.",
  "cambiar a modo oscuro": "Cambia el fondo claro por uno oscuro. Cansa menos la vista en lugares con poca luz.",
  "aumentar tamano de letra": "Hace el texto de todo el sistema un poco más grande.",
  "disminuir tamano de letra": "Hace el texto de todo el sistema un poco más pequeño.",
  "cerrar sesion": "Sale del sistema. Hazlo siempre que termines, sobre todo en un equipo compartido.",
  "marcar leidas": "Quita la marca de «nuevo» de los avisos que ya revisaste.",
  // Acciones de pantalla
  "nueva obra": "Pulsa para registrar una obra nueva. Tendrás que elegir un presupuesto que ya esté aprobado.",
  "nueva cuenta": "Pulsa para crear la cuenta de un empleado. El sistema le entrega una contraseña temporal.",
  "nuevo tipo": "Pulsa para agregar una categoría de trabajo nueva a la lista.",
  "nuevo cliente": "Pulsa para registrar un cliente nuevo con su RUT, razón social y datos de contacto.",
  "nuevo presupuesto": "Pulsa para armar una cotización: eliges al cliente y agregas cada ítem con su monto.",
  "emitir factura": "Pulsa para facturar una obra. Solo se pueden facturar obras que ya estén finalizadas.",
  "registrar pago": "Pulsa cuando el cliente ya pagó una factura, e indica la fecha en que pagó.",
  "anular pago": "Úsalo si registraste un pago por error. No se borra nada: la factura vuelve a quedar pendiente.",
  "registrar horas y materiales": "Anota cuántas horas trabajaste en la obra y qué materiales usaste. Sin esto la obra no se puede cerrar.",
  "ver ficha": "Abre la ficha de la obra: cliente, técnico, fechas, estado e historial.",
  "ver detalle": "Abre una ventana con toda la información de este registro.",
  "ver seguimiento": "Muestra paso a paso cómo ha avanzado la obra.",
  editar: "Te deja corregir los datos de este registro. Después pulsa Guardar.",
  "editar datos": "Te deja cambiar tu nombre, correo o teléfono. Después pulsa Guardar.",
  "cambiar contrasena": "Escribe tu contraseña actual y luego la nueva (entre 8 y 72 caracteres).",
  cambiar: "Te deja elegir otra opción en lugar de la que está seleccionada.",
  aprobar: "Da por aceptado el presupuesto y crea su PDF con el logo de FYAG. Después ya no se puede modificar.",
  rechazar: "Rechaza el presupuesto. El sistema te pedirá escribir el motivo.",
  "descargar pdf": "Descarga el presupuesto en PDF, listo para entregárselo al cliente.",
  descargar: "Baja a tu equipo el reporte, con solo los filtros que elegiste.",
  actualizar: "Vuelve a cargar la información para ver los datos más recientes.",
  desbloquear: "Reactiva una cuenta que se bloqueó por escribir mal la contraseña muchas veces.",
  desactivar: "Impide que el empleado vuelva a entrar al sistema. Su historial se conserva.",
  perfil: "Cambia el tipo de usuario (por ejemplo Técnico o Finanzas) y con eso, lo que puede ver y hacer.",
  facturas: "Muestra la lista de facturas emitidas.",
  anterior: "Vuelve a la página anterior de la lista.",
  siguiente: "Avanza a la página siguiente de la lista.",
  volver: "Regresa a la pantalla en la que estabas antes.",
  guardar: "Guarda todo lo que escribiste. Si sales sin guardar, se pierde.",
  cancelar: "Cierra esta ventana sin guardar nada de lo que escribiste.",
  cerrar: "Cierra esta ventana. No se pierde nada de lo ya guardado.",
  listo: "Confirma que ya terminaste y cierra la ventana.",
  // Buscadores y filtros
  "buscar obra": "Escribe aquí parte del nombre de la obra o del cliente y la lista se filtra sola.",
  "buscar cliente": "Escribe el RUT o el nombre de la empresa y la lista se filtra sola.",
  "buscar usuario": "Escribe un nombre o usuario y la lista se filtra sola.",
  "filtrar por estado": "Elige un estado (por ejemplo En proceso o Finalizada) para ver solo esas obras.",
  "filtrar por perfil": "Elige un tipo de usuario para ver solo las cuentas de ese perfil.",
  "filtrar por estado de pago": "Elige Pagadas o Pendientes para ver solo ese tipo de factura.",
  "tipo de consulta": "Elige cómo quieres revisar el historial: todo, por persona o por fechas.",
  usuario: "Elige de qué persona quieres ver los movimientos.",
  desde: "Primer día que quieres incluir. Se muestran datos desde esta fecha.",
  hasta: "Último día que quieres incluir. Ese día también se muestra.",
};

// Reglas para botones cuyo texto cambia (nombre de obra, estado, número de ítem…)
// Para botones cuyo texto cambia (ej: 'Pasar a En proceso')
const REGLAS = [
  [/^pasar a /, "Cambia la obra a este estado. Antes de hacerlo, el sistema te pide confirmar y revisa que no falte nada."],
  [/^notificaciones/, "Campana de avisos. Pulsa para ver las novedades de tus obras; si tiene un número, hay avisos sin leer."],
  [/^quitar .tem/, "Borra esta línea del presupuesto. Los demás ítems no se tocan."],
  [/^(agregar|anadir) .tem/, "Agrega otra línea (ítem) a la cotización."],
];

// Devuelve el mensaje de un botón, o null si no hay uno
export function describir(etiqueta) {
  const k = clave(etiqueta);
  if (!k) return null;
  return BOTONES[k] ?? REGLAS.find(([re]) => re.test(k))?.[1] ?? null;
}

// El menú principal y los iconos de la barra superior se explican juntos, cada grupo en un solo mensaje (más ordenado)
const CORTOS = {
  "tamano y grosor de letra": { t: "Tamaño de letra", d: "hace el texto más grande o más grueso" },
  "cambiar paleta de colores": { t: "Colores", d: "elige la paleta que prefieras" },
  "cambiar a modo claro": { t: "Modo claro", d: "fondo claro, útil con mucha luz" },
  "cambiar a modo oscuro": { t: "Modo oscuro", d: "fondo oscuro, cansa menos la vista" },
  "cerrar sesion": { t: "Cerrar sesión", d: "sal del sistema al terminar" },
  // Menú principal
  inicio: { t: "Inicio", d: "tu pantalla principal con todos los módulos" },
  dashboard: { t: "Dashboard", d: "resumen con los números del negocio" },
  obras: { t: "Obras", d: "lista de trabajos y su estado" },
  "mis obras": { t: "Mis obras", d: "las obras que te asignaron" },
  usuarios: { t: "Usuarios", d: "crea y administra cuentas de empleados" },
  auditoria: { t: "Auditoría", d: "historial de quién cambió qué y cuándo" },
  "mi perfil": { t: "Mi perfil", d: "tus datos y tu contraseña" },
  presupuestos: { t: "Presupuestos", d: "cotizaciones para los clientes" },
  cobranzas: { t: "Cobranzas", d: "facturas, pagos y deudas" },
  reportes: { t: "Reportes", d: "informes en PDF o Excel" },
  clientes: { t: "Clientes", d: "directorio de clientes" },
  "tipos de servicio": { t: "Tipos de servicio", d: "categorías de trabajo editables" },
};

export function corto(etiqueta) {
  const k = clave(etiqueta);
  if (/^notificaciones/.test(k)) return { t: "Avisos", d: "novedades de tus obras (el número indica los sin leer)" };
  return CORTOS[k] ?? null;
}

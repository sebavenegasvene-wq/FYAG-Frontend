# FYAG · Frontend (Sistema de Gestión de Obras y Presupuestos)

React 19 + Vite + React Router + Axios. Consume la API REST de Spring Boot (JWT).

```bash
npm install
npm run dev        # http://localhost:5173   (VITE_API_URL en .env, por defecto http://localhost:8082)
npm run build
```

## Pantallas por perfil (RBAC en el frontend; el backend igual valida con @PreAuthorize)

| Perfil | Rutas |
|---|---|
| ADMIN | `/admin`, `/admin/dashboard`, `/admin/obras` (solo lectura), `/admin/usuarios` |
| GERENCIA | `/gerencia` (dashboard), `/presupuestos` (aprobar/rechazar alto valor), `/obras` (+ rentabilidad), `/cobranzas`, `/reportes` |
| FINANZAS | `/finanzas` (dashboard), `/clientes`, `/presupuestos` (crear, editar, aprobar, PDF), `/obras`, `/cobranzas` (facturas, pagos, anular pago), `/reportes` |
| SUPERVISOR | `/supervisor` (crear obra, cambiar estado, costos), `/tipos-servicio` |
| TÉCNICO | `/tecnico` (solo sus obras, tarjetas, registra horas y materiales; sin montos ni buscador) |

Todos: `/login`, `/cambiar-password`, botón **?** de ayuda en cada pantalla, cierre de sesión por 30 min de inactividad.

## Hallazgos de la validación UX ya resueltos
1. Crear obra: el presupuesto se **elige** de una lista de aprobados (no se escribe).
2. Cambio de estado: botones con destino explícito ("Pasar a Finalizada") + ventana de confirmación; suspender exige motivo.
3. Técnico: sin barra de búsqueda; ve solo lo suyo.
4. Móvil (<720 px): las tablas pasan a formato tarjeta; sin scroll horizontal desde 360 px.

## Estructura
```
src/
  api/            clientes axios por recurso (ya existentes)
  components/     AppLayout, HelpButton, ui (Modal, DataTable, Kpi...), ClienteSelect, CostosForm
  hooks/          useForm, useToast, useInactividad
  lib/            format, errores, datos, roles (menú y colores de estado), ayuda (textos del "?")
  pages/          login, admin/, finanzas/, obras/, Tecnico, TiposServicio, Supervisor/Gerencia/Finanzas (wrappers)
  styles/app.css  sistema de diseño (tema oscuro Slate)
```
Las clases CSS conservan el prefijo `adm-` para no tocar las pantallas de administración ya hechas.

## Contratos de API supuestos (revisar contra tus DTO)
Donde `api/*.js` no mostraba la forma de la respuesta/solicitud, se asumió lo siguiente. Si tu backend usa otros nombres, ajusta solo el campo indicado:

- **Presupuesto** (resp.): `id, numeroPresupuesto, clienteRazonSocial, estado, fechaCreacion, fechaAprobacion, motivoRechazo, montoTotal, items[{descripcion, monto}]`. Crear/editar: `{ clienteId, items:[{descripcion, monto}] }`. Rechazar: `{ motivo }`. `/presupuestos/aprobados` debe devolver solo los que aún no tienen obra.
- **Obra** (crear): `{ presupuestoId, nombre, descripcion, tipoServicioId, tecnicoId, fechaInicio }`. Cambio de estado: `{ estado, motivo }`.
- **Costos** (PUT): `{ materiales, horasTecnicas, valorHora }`. El técnico no envía `valorHora` nuevo: se reenvía el existente.
- **Rentabilidad**: cualquier objeto con campos numéricos; se muestran todos con etiqueta automática (`$` o `%` según el nombre).
- **Factura** (resp.): `id, numeroFactura, obraNombre, clienteRazonSocial, fechaEmision, fechaVencimiento, fechaPago, monto, estadoPago, anulada`. Emitir: `{ obraId, numeroFactura, fechaEmision, fechaVencimiento, monto }`. Pago: `{ fechaPago }`. Anular pago: `{ motivo }`.
- **Clientes pendientes**: `clienteRazonSocial, facturasPendientes, montoAdeudado, diasAtraso`.
- **Reportes**: query `formato` con valores `PDF` / `EXCEL` (ver `FORMATOS` en `ReportesPage.jsx`), más `desde, hasta, estado, tecnicoId, clienteId`.
- **Técnicos** (`/usuarios/tecnicos`): `id, nombre, apellido, username`.
- Listados paginados: `{ content, page: { totalPages, totalElements } }` (o lista simple; ambos se toleran).

## Notas
- No hay endpoint de "asignar técnico" en `api/obras.js`: el técnico se define al crear la obra.
- El umbral de aprobación lo decide el backend: si Finanzas intenta aprobar sobre el umbral (403), se muestra el mensaje correspondiente.

# API Layer — GORAZUS Frontend

> Cierra el gap del cliente HTTP/WebSocket concreto — `docs/architecture/03-arquitectura-modulos-frontend.md §1,3`
> ya fija que "no hay `services/`/`repositories/`, el hook de TanStack Query llama
> directamente al cliente HTTP tipado" pero nunca detalla ese cliente. Este documento
> lo cierra sin introducir la capa que `03 §1` deliberadamente evitó. Ver
> [FRONTEND_ARCHITECTURE.md](./FRONTEND_ARCHITECTURE.md). Sin código.

## 1. El cliente HTTP: una instancia, no una capa

Un único cliente HTTP tipado (`fetch` nativo envuelto en una función delgada de
`packages/contracts` o `core` de frontend — **no** una clase `ApiService` por módulo,
eso reintroduciría la capa de servicio que `03 §1` descartó por KISS). Su
responsabilidad es exactamente tres cosas y nada más:

1. Anteponer la URL base versionada (`/api/v1/...`, ya fijado en
   `docs/architecture/07-convenciones-y-estandares.md §4`).
2. Adjuntar el header de autenticación (§4).
3. Normalizar la respuesta al formato ya fijado
   (`{data, meta}` / `{error:{code,message,details}}`, `07-convenciones §4`) antes de
   que TanStack Query la reciba.

Todo lo demás (qué endpoint, qué parámetros, qué invalidar) vive en el hook de cada
feature (`use-ventas.ts`, etc.) — el cliente no sabe qué es una "venta", solo sabe
hablar HTTP con el formato de contrato ya acordado.

## 2. Contratos tipados (Zod compartido)

Ya fijado en `03 §3`: el tipo de respuesta y el schema de validación del request se
importan de `modules/<x>/shared/contracts` — el mismo Zod schema que usa el backend
en `validators/`. Consecuencia operativa que no estaba explícita: cada hook de datos
de servidor (`use-ventas.ts`) valida la respuesta de la API contra ese mismo schema
antes de devolverla al componente (`schema.parse(response.data)`) — no solo se
comparte el _tipo_ en tiempo de compilación, se valida en runtime. Esto detecta un
drift entre backend y frontend (un campo removido, un tipo cambiado sin actualizar el
contrato) como un error explícito en desarrollo, en vez de un `undefined` silencioso
propagándose a la UI.

## 3. Interceptores: el equivalente frontend a "middleware"

El EPIC pide "Middleware" — en el mundo frontend/HTTP-cliente el concepto equivalente
es el **interceptor**: código que se ejecuta antes de cada request o después de cada
respuesta, sin que cada hook lo repita. No estaba definido — se cierra acá como una
cadena de responsabilidades fija, en este orden:

| Orden               | Interceptor         | Responsabilidad                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 (request)         | Auth                | Adjunta el access token vigente (§4)                                                                                                                                                                                                                                                                                                                                                    |
| 2 (request)         | Tenant              | No adjunta nada explícito — el `empresaId`/`branchId` activos viajan **dentro** del JWT (`docs/architecture/09-seguridad-y-multiempresa.md §3`), consistente con [ROUTING.md §8](./ROUTING.md#8-deep-linking-y-alcance-empresasucursal) — este interceptor existe para dejar constancia de que **no** se agrega un header `X-Company-Id` paralelo que pudiera desincronizarse del token |
| 3 (response, error) | Refresh-on-401      | Si la respuesta es 401 por token expirado (no por credenciales inválidas), dispara el flujo de refresh (§4) y reintenta la request original una vez — transparente para el hook que la originó                                                                                                                                                                                          |
| 4 (response, error) | Error normalization | Mapea cualquier respuesta no-2xx al formato `{error:{code,message,details}}` esperado por [ERROR_HANDLING.md](./ERROR_HANDLING.md), incluso si el error no vino del backend (timeout de red, error de CORS) — el resto de la aplicación siempre recibe la misma forma de error, nunca un `TypeError` crudo de `fetch`                                                                   |

Ningún hook de feature implementa su propia versión de estos cuatro pasos — viven una
sola vez en el cliente (§1), mismo principio DRY ya aplicado al resto del stack.

## 4. Autenticación y refresh de token

Mecanismo de tokens ya fijado en `docs/architecture/09-seguridad-y-multiempresa.md §1`
y `docs/architecture/13-modulo-auth.md` (access ~15 min, refresh ~7 días con rotación,
refresh token en cookie httpOnly). Este documento fija el consumo desde el cliente:

- **Access token:** vive únicamente en memoria de la aplicación (variable de módulo
  del cliente HTTP, o el `authSlice` de Zustand si hace falta leerlo en otro lugar —
  nunca en `localStorage`/`sessionStorage`, para reducir superficie de ataque XSS
  frente a robo de token).
- **Refresh token:** cookie httpOnly (`09 §1`, ya fijado) — el frontend nunca la lee
  ni la manipula directamente, solo confía en que el navegador la envía automáticamente
  a la request de refresh.
- **Flujo de refresh (interceptor §3, paso 3):** al recibir 401 con código de "token
  expirado", el cliente llama a `POST /api/v1/auth/refresh` (sin body — la cookie
  httpOnly viaja sola), recibe un access token nuevo, lo guarda en memoria y reintenta
  la request original. Si el refresh también falla (refresh token expirado o revocado
  — reuso detectado, `09 §1`), se limpia el estado de sesión y se redirige a `/login`
  (`ROUTING.md §5.1`).
- **Concurrencia:** si varias requests fallan por 401 al mismo tiempo (p. ej. un
  dashboard que dispara 5 queries en paralelo justo cuando el token expira), el
  interceptor de refresh se ejecuta **una sola vez** (deduplicado por una promesa
  compartida) — las 5 requests esperan ese único refresh y se reintentan con el token
  nuevo, en vez de disparar 5 refresh simultáneos contra el backend.
- **Cambio de empresa/sucursal:** ya fijado en
  [STATE_MANAGEMENT.md §3.3](./STATE_MANAGEMENT.md#33-persistencia) — emite un access
  token nuevo, mismo mecanismo de reemplazo en memoria que el refresh normal.

## 5. Cliente WebSocket

`core/realtime` (backend) ya expone el Gateway + adaptador Redis
(`docs/architecture/12-backend-enterprise.md §1.3`); el consumo desde hooks de feature
(`useVentaRealtime`) ya está nombrado en `29 §4` pero sin detallar la conexión en sí.
Se cierra acá:

- Una única conexión WebSocket por sesión de usuario (no una por feature/pantalla) —
  el cliente se conecta una vez al autenticarse y todos los hooks `use-<x>-realtime.ts`
  se suscriben a "rooms" específicos sobre esa misma conexión
  (`docs/architecture/05-flujo-de-datos.md §2` ya usa el concepto de room,
  `"inventario:empresa:{id}"`) — evita que abrir 10 pantallas con datos en vivo abra
  10 sockets TCP redundantes.
- La conexión vive en un módulo singleton de `core`/`ui-kit` (no en Zustand — es una
  conexión de red con su propio ciclo de vida, no un dato de estado; los hooks de
  feature se suscriben/desuscriben a rooms sobre esa conexión compartida al montar/
  desmontar).
- Reconexión automática con backoff si la conexión se cae (librería de socket.io-client
  o nativa de WS con reconexión manual, decisión de implementación) — al reconectar,
  se re-suscribe a los mismos rooms que tenía activos y se invalidan las queries de
  TanStack Query relevantes una vez (para no perder ningún evento ocurrido durante la
  desconexión, ya que WS no garantiza entrega de lo perdido offline).
- El mismo criterio de "nunca actualizar estado local a mano con el payload del
  evento" (`docs/architecture/05-flujo-de-datos.md §2`,
  [STATE_MANAGEMENT.md §2.4](./STATE_MANAGEMENT.md#24-sincronización-en-tiempo-real-websocket--cache))
  aplica sin excepción también acá — el cliente WS es puro transporte de la señal de
  invalidación, nunca fuente de verdad del dato en sí.

## 6. Subida de archivos

Ningún módulo de negocio habla con MinIO directamente — siempre a través de
`File Manager` (`docs/architecture/32-core-platform/08-frameworks-de-infraestructura.md §2,3`),
y "nunca se exponen credenciales de MinIO al frontend"
(`docs/architecture/08-infraestructura-y-despliegue.md`, línea sobre MinIO). Cierre
del patrón de consumo desde el cliente:

- El frontend sube el archivo por `multipart/form-data` a un endpoint REST estándar
  del módulo dueño (p. ej. `POST /api/v1/documentos` o el endpoint de adjuntos propio
  de cada módulo que use `File Manager` internamente) — **no** pide una URL firmada
  para subir directo a MinIO desde el navegador; el backend intermedia siempre para
  poder calcular el hash de integridad y registrar la fila en `core.files` de forma
  transaccional (`32.08 §3`, ya fijado).
- Progreso de subida vía el evento `progress` de `XMLHttpRequest` (`fetch` no expone
  progreso de subida de forma nativa) — usado solo para el indicador visual, nunca
  para lógica de negocio.
- Descarga: el backend expone la URL firmada de corta duración
  (`32.08 §2`, "URLs firmadas con expiración corta, nunca URLs públicas permanentes")
  vía un endpoint propio — el frontend redirige o abre esa URL, nunca la construye ni
  la cachea más allá de su vida útil.

## 7. Paginación y filtros (consumo, referencia)

Contrato ya fijado en `docs/architecture/07-convenciones-y-estandares.md §4`
(offset+limit, `{data, meta:{page,pageSize,total}}`). El hook de listado de cada
feature pasa `page`/`pageSize`/filtros como parte de la `queryKey`
([STATE_MANAGEMENT.md §2.1](./STATE_MANAGEMENT.md#21-convención-de-querykey)) y el
componente `DataTable` de `ui-kit/` (`UI_GUIDELINES.md §8`) consume `meta` para
renderizar el control de paginación — un solo componente de paginación en todo el
sistema, no reimplementado por módulo.

## 8. Trazabilidad

| Punto pedido / gap         | Ya fijado en                                                   | Cerrado/detallado acá                                            |
| -------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------- |
| Cliente HTTP               | `03 §1,3` (mencionado, no detallado)                           | Responsabilidad exacta y límites (§1)                            |
| Contratos Zod compartidos  | `03 §3`                                                        | Validación en runtime, no solo tipos (§2)                        |
| Middleware (interceptores) | Ninguno                                                        | Cadena de 4 interceptores (§3)                                   |
| Autenticación / refresh    | `09-seguridad-y-multiempresa.md §1`, `13-modulo-auth.md`       | Consumo desde cliente, deduplicación de refresh concurrente (§4) |
| WebSocket                  | `29 §4` (mención), `05-flujo-de-datos.md §2` (flujo de evento) | Conexión única, rooms, reconexión (§5)                           |
| Subida de archivos         | `32-core-platform/08 §2,3` (backend)                           | Patrón de consumo frontend (§6)                                  |
| Paginación                 | `07-convenciones-y-estandares.md §4`                           | Referencia (§7)                                                  |

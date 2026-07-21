# Error Handling — GORAZUS Frontend

> Cierra un gap real: el contrato de error de API ya está fijado
> (`docs/architecture/07-convenciones-y-estandares.md §4`) y el manejo de errores de
> validación de formulario también (`docs/product/08_USER_FLOWS.md §5`), pero ningún
> documento fijaba error boundaries, observabilidad de frontend, ni el caso general de
> desconexión fuera de POS. Este documento cierra esos tres puntos y consolida el
> resto por referencia. Ver [FRONTEND_ARCHITECTURE.md](./FRONTEND_ARCHITECTURE.md).
> Sin código.

## 1. Error boundaries por nivel

No estaba fijado — se establece una jerarquía de tres niveles, cada uno con un
propósito distinto (un solo `ErrorBoundary` raíz no es suficiente: un error en una
página de `contabilidad` no debería tumbar toda la sesión de trabajo del usuario si
tenía otras pestañas/flujos en curso dentro de la misma SPA):

| Nivel                                                                                                       | Captura                                                                                | Comportamiento al fallar                                                                                                                                                                                                                 |
| ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Raíz** (`apps/web/src/app/error-boundary.tsx`)                                                            | Errores no capturados por ningún nivel inferior — el "última línea de defensa"         | Pantalla completa de error genérico + botón "Recargar aplicación", reporta a observabilidad (§5)                                                                                                                                         |
| **De ruta** (uno por rama de `React.lazy()`, ver [ROUTING.md §3](./ROUTING.md#3-code-splitting-por-módulo)) | Errores de render dentro de una feature, y errores de carga de chunk (`ROUTING.md §7`) | Reemplaza solo el área de contenido de esa ruta — `AppShell`/sidebar/nav siguen funcionando, el usuario puede navegar a otra feature sin recargar                                                                                        |
| **De widget** (opcional, solo en Dashboard/BI — `ui-kit/components/layout/DashboardGrid`)                   | Un widget individual que falla al renderizar                                           | Ese widget muestra un estado de error propio, el resto del dashboard sigue funcionando — mismo principio ya fijado en `docs/product/09_WIREFRAMES.md §3` ("error parcial: una tarjeta falla, el resto de la pantalla sigue funcionando") |

Ningún nivel oculta el error al usuario con un `catch` silencioso — todo error
capturado se muestra (con distinto alcance visual según el nivel) y se reporta (§5).

## 2. Errores de validación de formulario (referencia)

Patrón completo ya fijado en `docs/product/08_USER_FLOWS.md §5`: error inline junto al
campo (nunca banner genérico), validación de formato en `onBlur`, validación de
negocio solo al intentar guardar, el contrato `{error:{code,message,details}}` del
backend (`docs/architecture/07-convenciones-y-estandares.md §4`) se mapea por campo
vía `details`, el `code` nunca se muestra al usuario. Implementación técnica: el
`onSuccess`/`onError` de la mutación de React Hook Form + Zod (`03 §4`) recibe el
error de la mutación de TanStack Query y usa `form.setError(campo, { message })` por
cada entrada de `details` — un solo punto de mapeo en `ui-kit/components/form/`
(`FormError`, ya nombrado en [UI_GUIDELINES.md §9](./UI_GUIDELINES.md#9-formularios-referencia)),
no reimplementado por cada formulario de cada módulo.

## 3. Traducción de códigos de error

El backend nunca traduce, siempre devuelve `code` estable (`ERR_CREDIT_LIMIT_EXCEEDED`,
patrón ya fijado en `docs/architecture/32-core-platform/03-localizacion-y-globalizacion.md §2`)
— el frontend es responsable de resolver ese código a un mensaje en el idioma activo.
Mecanismo (cierra el detalle de implementación que `32.03 §2` deja a nivel de
plataforma, no de frontend concreto):

- Diccionario `ui-kit/i18n/common/errors.<lang>.json` mapea `code` → mensaje
  traducido, mismo mecanismo de `react-i18next` ya fijado en
  [FRONTEND_ARCHITECTURE.md §8](./FRONTEND_ARCHITECTURE.md#8-internacionalización-i18n--nuevo-cierra-gap-de-implementación-frontend).
- Si un `code` no tiene entrada en el diccionario (error nuevo del backend sin
  traducción agregada todavía — inevitable en un sistema con 27 módulos backend
  evolucionando), el fallback es el propio `message` que el backend ya envía en
  español (`07-convenciones-y-estandares.md §4` — "`message` es para mostrar al
  usuario") en vez de mostrar el código crudo o un genérico "ocurrió un error". Esto
  evita que un error nuevo bloquee al usuario con un mensaje sin sentido mientras se
  agrega su traducción.
- Errores técnicos genuinos (500, timeout, error de red) nunca muestran detalle interno
  (stack trace, nombre de tabla — regla ya fijada en `32.03 §2` a nivel de backend, el
  frontend la respeta no exponiendo nada del cuerpo crudo de una respuesta 500 en la
  UI) — se muestra un mensaje genérico de "algo salió mal" traducible, y el detalle
  técnico va únicamente a observabilidad (§5).

## 4. Manejo de desconexión (fuera de POS)

El caso extremo (offline-first completo con cola local IndexedDB) ya está diseñado
para POS en `docs/architecture/45-modulo-pos-frontend.md §5` — es **el caso especial**,
no el default. Para el resto del sistema (formularios estándar, listados, reportes) el
comportamiento es más simple, cerrado acá porque no existía ninguna guía:

- Un indicador global no intrusivo (barra superior, `ui-kit/components/layout/`)
  aparece cuando el navegador reporta `navigator.onLine === false` o cuando una
  request falla por error de red — informa, no bloquea la UI.
- Una mutación que falla por desconexión (no por error de negocio) muestra un error
  con acción explícita "Reintentar" — no se reintenta automáticamente en bucle sin que
  el usuario lo sepa, para no dar la falsa sensación de que algo se guardó cuando no
  fue así. Esto es deliberadamente distinto del criterio de POS (que sí encola y
  reintenta solo) porque fuera de POS no hay la misma presión de "no interrumpir al
  cajero en medio de una fila de clientes" que justificó ese diseño más complejo —
  aplicar el mismo mecanismo en todos lados sería sobre-ingeniería para el volumen real
  de uso de, por ejemplo, un formulario de RRHH.
- Queries de lectura (TanStack Query) usan su comportamiento nativo de reintento con
  backoff exponencial (configuración por defecto de la librería, sin necesidad de
  mecanismo propio) — es lectura, no escritura, el riesgo de duplicar un efecto no
  aplica.

## 5. Observabilidad de frontend (nuevo — no estaba decidido)

Ningún documento nombraba una herramienta de error tracking para el frontend (a
diferencia del backend, que tiene logging estructurado vía `core/http`,
`07-convenciones-y-estandares.md §6`, y trazas/métricas vía Jaeger/Prometheus,
`docs/architecture/43-devops-plan-fase-9.md`). Se decide acá, mismo criterio de
consistencia con el stack de observabilidad de backend ya elegido:

- **Sentry** para error tracking de frontend — captura automática de errores no
  manejados y de los reportados explícitamente por cada `ErrorBoundary` (§1), con
  source maps subidos en CI para que el stack trace sea legible pese al bundling/
  minificación.
- Cada evento reportado incluye `empresaId`/`userId`/`requestId` cuando están
  disponibles en el contexto de la sesión — mismo criterio de correlación ya fijado
  para logs de backend (`07-convenciones-y-estandares.md §6`), para poder cruzar un
  error de frontend con la request de backend que lo originó usando el mismo
  `requestId`.
- No se introduce una segunda herramienta de métricas de frontend (Web Vitals) fuera
  de lo que Sentry Performance ya provee sobre la misma integración — evita agregar un
  segundo proveedor solo para no duplicar el mecanismo de envío/autenticación.
- Errores de negocio esperados (una regla de validación que el usuario puede corregir,
  §2-3) **no** se reportan a Sentry como error — son flujo normal de la aplicación,
  no una falla. Solo errores no manejados o fallos de infraestructura (chunk que no
  carga, 500 del backend, excepción de render) generan un evento de observabilidad.

## 6. Trazabilidad

| Punto                             | Ya fijado en                                                               | Cerrado/detallado acá           |
| --------------------------------- | -------------------------------------------------------------------------- | ------------------------------- |
| Contrato de error de API          | `docs/architecture/07-convenciones-y-estandares.md §4`                     | Referencia (§2-3)               |
| Error de validación de formulario | `docs/product/08_USER_FLOWS.md §5`                                         | Mecanismo técnico de mapeo (§2) |
| Traducción de errores             | `docs/architecture/32-core-platform/03-localizacion-y-globalizacion.md §2` | Diccionario + fallback (§3)     |
| Desconexión (caso POS)            | `docs/architecture/45-modulo-pos-frontend.md §5`                           | Referencia — no repetido        |
| Desconexión (caso general)        | Ninguno                                                                    | Cerrado (§4)                    |
| Error boundaries                  | Ninguno                                                                    | Jerarquía de 3 niveles (§1)     |
| Observabilidad de frontend        | Ninguno                                                                    | Sentry, decisión cerrada (§5)   |

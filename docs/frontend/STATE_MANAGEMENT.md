# State Management — GORAZUS Frontend

> Expande `docs/architecture/03-arquitectura-modulos-frontend.md §3,7` y
> `docs/architecture/29-frontend-enterprise.md §5` (decisión cerrada: Zustand) sin
> repetirlos. Ver [FRONTEND_ARCHITECTURE.md](./FRONTEND_ARCHITECTURE.md) para cómo
> encaja este documento en el set completo. Sin código.

## 1. Las cuatro categorías de estado (regla general)

Todo estado del frontend cae en exactamente una de estas categorías. La pregunta que
decide dónde vive un dato nuevo es siempre **"¿de dónde viene este dato y quién más lo
necesita?"**, nunca conveniencia de implementación:

| Categoría                       | Ejemplo                                          | Vive en                                | Nunca vive en                             |
| ------------------------------- | ------------------------------------------------ | -------------------------------------- | ----------------------------------------- |
| **Estado de servidor**          | Listado de facturas, detalle de un cliente       | TanStack Query                         | `useState`, Zustand                       |
| **Estado global de aplicación** | Empresa/sucursal activa, tema, sidebar colapsado | Zustand (store raíz, ver §3)           | Context, `useState` a nivel de componente |
| **Estado local de UI**          | Modal abierto, tab activo, fila expandida        | `useState`/`useReducer` del componente | Zustand, TanStack Query                   |
| **Estado de formulario**        | Valores/errores de un formulario en edición      | React Hook Form (§4)                   | Zustand, `useState` campo por campo       |

Regla dura ya fijada (`03 §7`, repetida acá porque es la más violada en proyectos
grandes): **el estado de servidor nunca se copia a `useState` "por si acaso" ni se
duplica en un store global.** Si un componente necesita derivar algo de una respuesta
de API, deriva en el render (o con `useMemo` si el cálculo es costoso, ver
[PERFORMANCE.md §5](./PERFORMANCE.md#5-memoización-cuándo-sí-cuándo-no)) — nunca
sincroniza manualmente una copia con `useEffect`.

## 2. TanStack Query — estado de servidor

Capa de acceso a datos completa (`03 §1` — no hay `services/`/`repositories/`, el
hook **es** la capa). Este documento fija las convenciones operativas que `03 §3` no
detallaba:

### 2.1 Convención de `queryKey`

```
[modulo, recurso, ...params]
```

Ya fijado en `03 §3`. Reglas adicionales:

- El primer segmento es siempre el nombre de la feature (`'ventas'`, `'inventario'`),
  nunca el nombre técnico del endpoint — permite invalidar todo lo de una feature con
  `queryClient.invalidateQueries({ queryKey: ['ventas'] })` cuando hace falta (p. ej.
  al cambiar de empresa activa, ver §3.3).
- Params van en el orden `[filtros/paginación, id]` — un detalle usa
  `['ventas', 'detalle', ventaId]`, un listado usa
  `['ventas', 'listado', filtros]`, nunca al revés, para que las claves sean
  predecibles al hacer `grep` sobre invalidaciones.
- Objetos de filtro se pasan tal cual (no serializados a string) — TanStack Query
  hace deep-equal internamente, serializar manualmente es trabajo redundante.

### 2.2 `staleTime`/`gcTime` por tipo de dato

No decidido antes explícitamente — se fija acá porque el valor por defecto de
TanStack Query (`staleTime: 0`, refetch en cada foco de ventana) es incorrecto para
la mayoría de las pantallas de un ERP:

| Tipo de dato                                                             | `staleTime`        | Justificación                                                                                                                                                                                                                                                             |
| ------------------------------------------------------------------------ | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Catálogos de baja frecuencia (productos, clientes, cuentas contables)    | 5 min              | Cambian poco; recargar en cada foco de ventana desperdicia ancho de banda sin beneficio real                                                                                                                                                                              |
| Listados transaccionales (facturas, órdenes)                             | 30 seg             | Balance entre frescura y no golpear la API en cada click de "volver"                                                                                                                                                                                                      |
| Datos de un turno activo (POS, Caja)                                     | 0 (siempre fresco) | Ya fijado como excepción explícita en `03 §3` — "no se depende de refetch automático por foco de ventana como única estrategia en pantallas transaccionales" — acá además se pone en 0 porque el costo de un dato desactualizado (doble cobro, arqueo incorrecto) es alto |
| Datos de referencia casi estáticos (países, monedas, unidades de medida) | 1 hora             | Prácticamente no cambian en la vida de una sesión                                                                                                                                                                                                                         |

`gcTime` (tiempo que un dato "no observado" permanece en cache antes de purgarse) se
deja en el default de la librería (5 min) salvo el caso de catálogos grandes de uso
frecuente (Producto, Cliente) donde se sube a 30 min — evita re-pedir el mismo
catálogo al navegar entre pantallas del mismo módulo en una sesión de trabajo típica.

### 2.3 Invalidación tras mutación

Ya fijado como principio (`03 §3` — "las mutaciones invalidan explícitamente las
queries afectadas"). Patrón operativo:

- Toda mutación (`useMutation`) invalida en su `onSuccess` las `queryKey` que su
  propio dominio de negocio afecta — nunca un `invalidateQueries()` global sin
  argumentos (invalidaría toda la cache de la aplicación, incluida la de otras
  features abiertas en otras pestañas del navegador de la misma sesión).
- Cuando una mutación de un módulo afecta a otro por relación de negocio (confirmar
  una venta afecta el stock de `inventario`), la invalidación cruzada se declara
  explícitamente en el hook de mutación de quien la origina — no se espera a que el
  evento WebSocket (§2.4) llegue eventualmente, para que la UI del usuario que originó
  la acción se sienta instantánea sin depender de la vuelta completa por el bus de
  eventos.

### 2.4 Sincronización en tiempo real (WebSocket → cache)

Patrón completo ya fijado en `docs/architecture/05-flujo-de-datos.md §2`: un evento
WS entrante **nunca** actualiza estado local a mano — invalida la `queryKey`
correspondiente y deja que TanStack Query vuelva a pedir la fuente de verdad. El hook
`useVentaRealtime` (categoría "Tiempo real" de la taxonomía, `29 §4`) es una
suscripción que internamente llama `queryClient.invalidateQueries(...)`, nunca
`queryClient.setQueryData(...)` a mano con el payload del evento — evita divergencias
entre lo que el WS mandó (potencialmente parcial) y lo que hay realmente en base de
datos.

### 2.5 Prefetching y optimistic updates

- **Prefetching:** al hacer hover/focus sobre un link a un detalle desde un listado ya
  cargado (p. ej. una fila de la tabla de facturas), se dispara
  `queryClient.prefetchQuery` con la misma `queryKey` que usará la página de detalle —
  reduce la percepción de espera al navegar, sin cambiar el modelo de datos.
- **Optimistic updates:** reservado para acciones de bajo riesgo y alta frecuencia
  donde la probabilidad de fallo del servidor es marginal (marcar una notificación
  como leída, cambiar el estado de una tarjeta en un Kanban de CRM/RRHH — ver
  `docs/product/07_SCREEN_CATALOG.md §4.11,§4.15`). **Nunca** se usa optimistic update
  sobre una mutación con reglas de negocio no triviales (confirmar una venta, cerrar
  un período fiscal) — el costo de revertir una UI que ya mostró éxito y luego falla
  por una regla de negocio (stock insuficiente, período ya cerrado) es peor que
  esperar la confirmación real del servidor.

## 3. Zustand — estado global de la aplicación

Decisión y alcance ya cerrados en `29 §5`: **un único store raíz con slices**
(`authSlice`, `uiSlice`), nunca un store por concepto. Este documento detalla la
forma de esos slices y agrega el slice que faltaba nombrar.

### 3.1 `authSlice`

Contiene exactamente lo que `29 §5` ya delimitó — **no crece más allá de esto sin
pasar primero por este documento**:

- Usuario autenticado (datos de sesión mínimos para UI: nombre, email, avatar — nunca
  permisos/roles completos, eso se resuelve vía `usePermiso()` consultando su propia
  fuente, ver [ROUTING.md §5](./ROUTING.md#5-guards-de-ruta-autenticación-y-autorización)).
- Empresa activa (`activeCompanyId`) y sucursal activa (`activeBranchId` —
  nuevo, no nombrado explícitamente en `29 §5` pero necesario por el modelo de alcance
  de `docs/product/05_INFORMATION_ARCHITECTURE.md §5`: Tenant→Company→Branch requiere
  reflejar ambos niveles, no solo empresa). Cambiar cualquiera de los dos re-emite un
  access token nuevo (`09-seguridad-y-multiempresa.md §3`) — el store solo refleja cuál
  está activa, nunca decide el alcance por su cuenta.
- Idioma activo del usuario (ver [FRONTEND_ARCHITECTURE.md §8](./FRONTEND_ARCHITECTURE.md#8-internacionalización-i18n--nuevo-cierra-gap-de-implementación-frontend)).

### 3.2 `uiSlice`

- Tema claro/oscuro.
- Sidebar colapsado/expandido (persistente, ver `docs/product/06_NAVIGATION.md §3`).
- Nada más — un modal abierto, un tab activo de una pantalla específica **no** son
  `uiSlice`, son estado local de esa página (§1, tabla).

### 3.3 Persistencia

Middleware `persist` de Zustand (`29 §5`, punto 2) sobre `localStorage`, aplicado
selectivamente: `activeCompanyId`/`activeBranchId`/idioma/tema/sidebar sobreviven a un
refresh; el usuario autenticado en sí **no** se persiste en el store (se re-deriva del
access token válido al cargar la app, ver
[API_LAYER.md §4](./API_LAYER.md#4-autenticación-y-refresh-de-token) — persistir un
usuario "de mentira" en `localStorage` desincronizado del token real es una fuente
clásica de bugs de sesión fantasma).

**Cambio de empresa/sucursal activa** (`docs/product/08_USER_FLOWS.md §7`): al
confirmar el cambio, el flujo es: (1) pedir el nuevo access token al backend, (2)
actualizar `activeCompanyId`/`activeBranchId` en el store, (3) invalidar **toda** la
cache de TanStack Query de queries "de sucursal" o "consolidables"
(`docs/product/07_SCREEN_CATALOG.md §5` — la clasificación de alcance por módulo es la
entrada de qué se invalida), nunca queries "de empresa, sin sucursal" que no dependen
del cambio. El componente que dispara el cambio no orquesta esto a mano — es un método
único del store (`switchCompanyContext(companyId, branchId)`) para que ningún flujo de
cambio de contexto quede parcialmente implementado en un componente aislado.

### 3.4 Selectores granulares

Ya justificado en `29 §5` punto 1 (por qué Zustand y no Context). Regla operativa:
todo componente que lee del store usa un selector que apunta al slice/campo exacto que
necesita (`useAppStore(s => s.ui.theme)`), nunca desestructura el store completo — es
lo que hace real la ventaja de "sin re-render en cascada" que motivó la decisión.

## 4. Formularios — React Hook Form + Zod (estado de formulario)

Patrón completo ya fijado en `03 §4` — schema Zod compartido FE/BE, `zodResolver`,
componentes de `ui-kit/components/form/`. Este documento solo aclara su lugar en la
taxonomía de estado: el estado de un formulario (valores, dirty, errores) vive
**dentro de React Hook Form**, nunca replicado en `useState` paralelo ni en Zustand —
un formulario nunca es "estado global" aunque sus datos, una vez guardados, pasen a
ser estado de servidor (TanStack Query invalida y vuelve a pedir tras el `onSuccess`
de la mutación, §2.3).

Ver [ERROR_HANDLING.md §2](./ERROR_HANDLING.md#2-errores-de-validación-de-formulario)
para el manejo de errores de validación (formato vs. negocio) dentro de este patrón.

## 5. Taxonomía de hooks (aplicada)

`29 §4` ya fija las 6 categorías de hooks. Este documento las ata a las categorías de
estado de §1 para que quede una única tabla de referencia:

| Categoría de hook (`29 §4`)                        | Categoría de estado que maneja                                                                      | Documento de detalle                                                        |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Datos de servidor (`useVentas`)                    | Estado de servidor                                                                                  | §2 arriba, [API_LAYER.md](./API_LAYER.md)                                   |
| Tiempo real (`useVentaRealtime`)                   | Estado de servidor (vía invalidación)                                                               | §2.4 arriba                                                                 |
| Formularios (`useForm`)                            | Estado de formulario                                                                                | §4 arriba                                                                   |
| Autorización (`usePermiso`)                        | Ninguno propio — consulta una fuente externa (permisos resueltos), no mantiene estado mutable local | [ROUTING.md §5](./ROUTING.md#5-guards-de-ruta-autenticación-y-autorización) |
| UI genérica (`useDebounce`, `useMediaQuery`)       | Estado local de UI (encapsulado dentro del hook)                                                    | [UI_GUIDELINES.md](./UI_GUIDELINES.md)                                      |
| Estado global (`useAuthStore`, `useActiveCompany`) | Estado global de aplicación                                                                         | §3 arriba                                                                   |

Regla que atraviesa las seis, repetida de `29 §4` porque es la que más se rompe bajo
presión de entrega: **un hook nunca mezcla más de una categoría.** Un hook que
necesita dos (p. ej. una página que necesita datos de servidor Y saber si el usuario
tiene permiso de editar) compone dos hooks separados dentro del componente de página,
no fusiona la lógica en un hook nuevo "todo en uno".

## 6. Qué NO se introduce (límites explícitos)

- **Redux / Redux Toolkit** — descartado en `03 §7`/`29 §5`, no se reabre.
- **Recoil / Jotai / Valtio** — no evaluados porque Zustand ya resuelve la superficie
  real de estado global (§3), que es deliberadamente pequeña; introducir una segunda
  librería de estado atómico sería duplicar sin necesidad (KISS).
- **Context API para estado que cambia con frecuencia** — sigue disponible para lo que
  sí es su caso de uso correcto (inyectar el `ThemeProvider` de `ui-kit/theme/`, un
  valor que cambia raramente y no necesita selectores granulares), nunca para
  reemplazar Zustand o TanStack Query.
- **Estado derivado sincronizado a mano con `useEffect`** — si un valor se puede
  calcular a partir de estado de servidor + estado local ya existentes, se calcula en
  el render (o `useMemo`), nunca se sincroniza con un efecto que copia un valor a otro
  estado — fuente clásica de bugs de desincronización y de renders extra.
